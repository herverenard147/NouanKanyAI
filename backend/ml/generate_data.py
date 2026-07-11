"""
generate_data.py — Génération de données de capteurs industriels simulées
Simule 1 an de données pour des équipements d'hôtels et d'industries.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_sensor_data(n_days=365, output_path='backend/ml/data/sensor_data.csv'):
    """
    Génère des données réalistes de capteurs pour 4 types de machines:
    - Climatisation centrale (Hôtel/Industrie)
    - Système de réfrigération (Hôtel/Industrie)
    - Pompe hydraulique (Industrie)
    - Éclairage & Bureautique (Hôtel/Tertiaire)
    """
    np.random.seed(42)
    
    machines = {
        'CLIM-001': {'type': 'Climatisation', 'base_power': 8.5, 'max_power': 15.0},
        'FRIG-002': {'type': 'Réfrigération', 'base_power': 3.0, 'max_power': 5.5},
        'POMP-003': {'type': 'Pompe Hydraulique', 'base_power': 12.0, 'max_power': 22.0},
        'ELEC-004': {'type': 'Éclairage/Bureautique', 'base_power': 2.0, 'max_power': 4.5},
    }
    
    records = []
    start_date = datetime(2024, 1, 1)
    
    for day in range(n_days):
        current_date = start_date + timedelta(days=day)
        day_of_week = current_date.weekday()  # 0=Lundi
        month = current_date.month
        
        # Facteur saisonnier (plus chaud = plus de clim en Afrique de l'Ouest)
        # Saison chaude: Mars-Mai, Octobre  |  Saison fraîche: Juillet-Août
        seasonal_factor = 1.0
        if month in [3, 4, 5, 10]:
            seasonal_factor = 1.3  # Saison chaude
        elif month in [7, 8]:
            seasonal_factor = 0.8  # Saison fraîche
        
        for hour in range(24):
            for machine_id, specs in machines.items():
                base = specs['base_power']
                max_p = specs['max_power']
                
                # Facteur horaire (pic entre 10h-16h)
                if 10 <= hour <= 16:
                    hour_factor = 1.4
                elif 7 <= hour <= 9 or 17 <= hour <= 20:
                    hour_factor = 1.1
                else:
                    hour_factor = 0.5  # Nuit
                
                # Facteur week-end (moins de consommation pour l'industrie)
                weekend_factor = 0.6 if day_of_week >= 5 and specs['type'] == 'Pompe Hydraulique' else 1.0
                
                # Consommation calculée
                power_kw = base * hour_factor * seasonal_factor * weekend_factor
                power_kw += np.random.normal(0, base * 0.1)  # Bruit
                power_kw = np.clip(power_kw, 0, max_p)
                
                # Température (corrélée à la puissance)
                temperature_c = 25 + (power_kw / max_p) * 30 + np.random.normal(0, 2)
                
                # Vibration (corrélée pour les pompes, stable pour le reste)
                if specs['type'] == 'Pompe Hydraulique':
                    vibration_hz = 20 + (power_kw / max_p) * 40 + np.random.normal(0, 3)
                else:
                    vibration_hz = 5 + np.random.normal(0, 1)
                
                # Pression (principalement pour les pompes)
                pressure_bar = 2.0 + (power_kw / max_p) * 4.0 + np.random.normal(0, 0.3)
                
                # Anomalies simulées (environ 3% des données)
                is_anomaly = 0
                if np.random.random() < 0.03:
                    is_anomaly = 1
                    # Une anomalie = valeurs anormalement élevées
                    power_kw *= np.random.uniform(1.5, 2.5)
                    temperature_c += np.random.uniform(15, 40)
                    vibration_hz *= np.random.uniform(1.8, 3.0)
                
                records.append({
                    'timestamp': current_date.replace(hour=hour),
                    'machine_id': machine_id,
                    'machine_type': specs['type'],
                    'power_kw': round(power_kw, 2),
                    'temperature_c': round(temperature_c, 1),
                    'vibration_hz': round(vibration_hz, 1),
                    'pressure_bar': round(pressure_bar, 2),
                    'hour_of_day': hour,
                    'day_of_week': day_of_week,
                    'month': month,
                    'is_anomaly': is_anomaly
                })
    
    df = pd.DataFrame(records)
    
    # Créer le dossier si nécessaire
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    
    print(f"[OK] {len(df)} lignes de donnees generees et sauvegardees dans {output_path}")
    print(f"   -> {df['is_anomaly'].sum()} anomalies simulees ({df['is_anomaly'].mean()*100:.1f}%)")
    print(f"   -> Machines: {df['machine_id'].nunique()}")
    print(f"   -> Periode: {df['timestamp'].min()} -> {df['timestamp'].max()}")
    
    return df

if __name__ == '__main__':
    generate_sensor_data()
