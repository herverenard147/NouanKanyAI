"""
recommendation_engine.py — Moteur de recommandation hybride (IA + Règles)
Combine les prédictions XGBoost et les détections d'anomalies pour générer
des actions concrètes de réduction de consommation.
"""

import pandas as pd
import numpy as np
import joblib
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import equipment_catalog

# Tarif CIE Côte d'Ivoire (FCFA/kWh) - moyenne
TARIF_KWH = 65  # FCFA par kWh

def load_models(xgb_path='backend/ml/models/xgboost_model.pkl',
                iso_path='backend/ml/models/isolation_forest.pkl'):
    """Charge les modèles entraînés."""
    xgb_data = joblib.load(xgb_path)
    iso_data = joblib.load(iso_path)
    return xgb_data, iso_data

def predict_next_hours(xgb_data, machine_id, current_temp, current_vibration, 
                       current_pressure, hours_ahead=24):
    """
    Prédit la consommation des prochaines heures pour une machine donnée.
    """
    model = xgb_data['model']
    le = xgb_data['label_encoder']
    features = xgb_data['features']
    
    # Encoder la machine
    try:
        machine_encoded = le.transform([machine_id])[0]
    except ValueError:
        machine_encoded = 0
    
    predictions = []
    from datetime import datetime
    now = datetime.now()
    
    for h in range(hours_ahead):
        hour = (now.hour + h) % 24
        day = (now.weekday() + (now.hour + h) // 24) % 7
        month = now.month
        
        input_data = pd.DataFrame([{
            'temperature_c': current_temp,
            'vibration_hz': current_vibration,
            'pressure_bar': current_pressure,
            'hour_of_day': hour,
            'day_of_week': day,
            'month': month,
            'machine_encoded': machine_encoded
        }])
        
        pred_kw = model.predict(input_data)[0]
        predictions.append({
            'hour': hour,
            'predicted_kw': round(float(pred_kw), 2),
            'cost_fcfa': round(float(pred_kw) * TARIF_KWH, 0)
        })
    
    return predictions

def detect_anomalies(iso_data, sensor_readings):
    """
    Vérifie si les lectures de capteurs contiennent des anomalies.
    sensor_readings: dict avec power_kw, temperature_c, vibration_hz, pressure_bar, machine_id
    """
    model = iso_data['model']
    le = iso_data['label_encoder']
    
    try:
        machine_encoded = le.transform([sensor_readings['machine_id']])[0]
    except ValueError:
        machine_encoded = 0
    
    input_data = pd.DataFrame([{
        'power_kw': sensor_readings['power_kw'],
        'temperature_c': sensor_readings['temperature_c'],
        'vibration_hz': sensor_readings['vibration_hz'],
        'pressure_bar': sensor_readings['pressure_bar'],
        'machine_encoded': machine_encoded
    }])
    
    prediction = model.predict(input_data)[0]
    score = model.decision_function(input_data)[0]
    
    return {
        'is_anomaly': prediction == -1,
        'anomaly_score': round(float(score), 4),
        'severity': 'critique' if score < -0.3 else 'modérée' if score < -0.1 else 'faible'
    }

def generate_recommendations(xgb_data, iso_data, machines_state):
    """
    Génère des recommandations actionnables basées sur l'état actuel des machines.
    
    machines_state: liste de dicts avec les infos des machines
    [
        {'machine_id': 'CLIM-001', 'power_kw': 12.5, 'temperature_c': 45.0, 
         'vibration_hz': 8.0, 'pressure_bar': 3.2, 'priority': 'haute'}
    ]
    """
    recommendations = []

    for machine in machines_state:
        mid = machine['machine_id']
        nom = machine.get('nom') or mid

        # 1. Vérifier les anomalies
        anomaly = detect_anomalies(iso_data, machine)
        if anomaly['is_anomaly']:
            recommendations.append({
                'machine_id': mid,
                'type': 'alerte',
                'severity': anomaly['severity'],
                'title': f"Anomalie détectée sur {nom}",
                'description': f"Les capteurs de {nom} montrent un comportement anormal "
                              f"(score: {anomaly['anomaly_score']}). "
                              f"Température: {machine['temperature_c']}°C, "
                              f"Vibration: {machine['vibration_hz']}Hz.",
                'action': f"Lancez un diagnostic d'urgence sur {nom}",
                'gain_fcfa': 0
            })
        
        # 2. Prédire la consommation future
        preds = predict_next_hours(
            xgb_data, mid, 
            machine['temperature_c'], 
            machine['vibration_hz'],
            machine['pressure_bar'],
            hours_ahead=6
        )
        
        total_predicted_cost = sum(p['cost_fcfa'] for p in preds)
        avg_predicted_kw = np.mean([p['predicted_kw'] for p in preds])
        
        # 3. Règles de recommandation
        
        # Règle 1: Surconsommation (puissance actuelle > 120% de la moyenne prédite)
        if machine['power_kw'] > avg_predicted_kw * 1.2:
            excess_kw = machine['power_kw'] - avg_predicted_kw
            gain = round(excess_kw * 6 * TARIF_KWH)  # Gain sur 6h
            recommendations.append({
                'machine_id': mid,
                'type': 'optimisation',
                'severity': 'modérée',
                'title': f"Surconsommation sur {nom}",
                'description': f"{nom} consomme {machine['power_kw']}kW alors que la prédiction "
                              f"normale est de {avg_predicted_kw:.1f}kW. "
                              f"Réduire la charge permettrait d'économiser.",
                'action': f"Éteignez {nom} pendant 10 minutes pour réduire la charge de {excess_kw:.1f}kW",
                'gain_fcfa': gain
            })

        # Règle 2: Délestage aux heures de pointe (si machine basse priorité)
        from datetime import datetime
        current_hour = datetime.now().hour
        if 10 <= current_hour <= 16 and machine.get('priority') == 'basse':
            gain = round(machine['power_kw'] * 2 * TARIF_KWH)  # 2h de délestage
            recommendations.append({
                'machine_id': mid,
                'type': 'délestage',
                'severity': 'faible',
                'title': f"Délestage préventif possible sur {nom}",
                'description': f"Nous sommes en heure de pointe (10h-16h). {nom} est de priorité "
                              f"basse et peut être mise en veille pendant 2h sans impact.",
                'action': f"Mettez {nom} en veille pendant 2h (délestage préventif)",
                'gain_fcfa': gain
            })

        # Règle 3: Surchauffe (température > 60°C)
        if machine['temperature_c'] > 60:
            recommendations.append({
                'machine_id': mid,
                'type': 'alerte',
                'severity': 'critique',
                'title': f"Surchauffe détectée sur {nom}",
                'description': f"La température de {nom} est de {machine['temperature_c']}°C "
                              f"(seuil critique: 60°C). Risque de dommage matériel.",
                'action': f"Éteignez {nom} immédiatement et lancez une inspection",
                'gain_fcfa': 0
            })

        # Règle 4: Conseil proactif d'efficacité — un modèle plus économe existe
        # dans la même catégorie (indépendant de l'état actuel de la machine).
        categorie = machine.get('categorie')
        marque = machine.get('marque')
        if categorie and marque:
            alt = equipment_catalog.find_efficient_alternative(categorie, marque)
            if alt:
                alt_marque, indice_actuel, indice_alt = alt
                gain_pct = round((1 - indice_alt / indice_actuel) * 100)
                gain = round(machine['power_kw'] * 24 * 30 * TARIF_KWH * (indice_actuel - indice_alt) / indice_actuel)
                recommendations.append({
                    'machine_id': mid,
                    'type': 'efficacite',
                    'severity': 'faible',
                    'title': f"Alternative plus économe pour {nom}",
                    'description': f"{nom} ({marque}) est un modèle {categorie.lower()} qui consomme "
                                  f"plus que nécessaire pour ce type de tâche. Un équipement {alt_marque} "
                                  f"de même catégorie consomme en moyenne {gain_pct}% de moins pour un usage équivalent.",
                    'action': f"Envisagez de remplacer {nom} par un modèle {alt_marque} plus économe",
                    'gain_fcfa': gain
                })

    # Trier par sévérité
    severity_order = {'critique': 0, 'modérée': 1, 'faible': 2}
    recommendations.sort(key=lambda x: severity_order.get(x['severity'], 3))
    
    return recommendations

if __name__ == '__main__':
    # Test avec des donnees fictives
    print("[TEST] Test du moteur de recommandation...\n")
    
    xgb_data, iso_data = load_models()
    
    # Simuler l'etat de 3 machines
    machines = [
        {'machine_id': 'CLIM-001', 'power_kw': 14.0, 'temperature_c': 45.0, 
         'vibration_hz': 8.0, 'pressure_bar': 3.2, 'priority': 'haute'},
        {'machine_id': 'POMP-003', 'power_kw': 25.0, 'temperature_c': 72.0, 
         'vibration_hz': 55.0, 'pressure_bar': 6.5, 'priority': 'haute'},
        {'machine_id': 'ELEC-004', 'power_kw': 3.5, 'temperature_c': 30.0, 
         'vibration_hz': 5.0, 'pressure_bar': 2.1, 'priority': 'basse'},
    ]
    
    recs = generate_recommendations(xgb_data, iso_data, machines)
    
    print(f"[RESULT] {len(recs)} recommandation(s) generee(s):\n")
    for r in recs:
        tag = '[!!]' if r['severity'] == 'critique' else '[!]' if r['severity'] == 'moderee' else '[i]'
        print(f"{tag} [{r['type'].upper()}] {r['title']}")
        print(f"   {r['description']}")
        print(f"   -> Action: {r['action']}")
        if r['gain_fcfa'] > 0:
            print(f"   -> Gain estime: {r['gain_fcfa']:,.0f} FCFA")
        print()

