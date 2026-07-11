"""
train_anomaly.py — Entraînement du modèle de détection d'anomalies
Utilise Isolation Forest pour détecter les capteurs qui envoient des données anormales.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
import joblib
import os

def train_anomaly_detector(data_path='backend/ml/data/sensor_data.csv',
                            model_path='backend/ml/models/isolation_forest.pkl'):
    """
    Entraîne un Isolation Forest pour détecter les anomalies dans les capteurs.
    """
    print("[INFO] Chargement des donnees...")
    df = pd.read_csv(data_path)
    
    le = LabelEncoder()
    df['machine_encoded'] = le.fit_transform(df['machine_id'])
    
    # Features pour la détection d'anomalies
    features = ['power_kw', 'temperature_c', 'vibration_hz', 'pressure_bar', 'machine_encoded']
    X = df[features]
    
    # Entraînement Isolation Forest
    print("\n[TRAIN] Entrainement du modele Isolation Forest...")
    iso_forest = IsolationForest(
        n_estimators=200,
        contamination=0.05,  # On s'attend à ~5% d'anomalies
        random_state=42,
        n_jobs=-1
    )
    
    iso_forest.fit(X)
    
    # Prédictions : -1 = anomalie, 1 = normal
    predictions = iso_forest.predict(X)
    df['predicted_anomaly'] = (predictions == -1).astype(int)
    
    # Évaluation (comparaison avec nos anomalies simulées)
    print(f"\n[RESULT] Resultats de la detection:")
    print(f"   -> Anomalies reelles: {df['is_anomaly'].sum()}")
    print(f"   -> Anomalies detectees: {df['predicted_anomaly'].sum()}")
    
    # Rapport de classification
    print(f"\n[REPORT] Rapport de classification:")
    print(classification_report(
        df['is_anomaly'], 
        df['predicted_anomaly'],
        target_names=['Normal', 'Anomalie']
    ))
    
    # Score d'anomalie pour chaque point
    scores = iso_forest.decision_function(X)
    df['anomaly_score'] = scores
    
    # Top 10 anomalies les plus graves
    top_anomalies = df.nsmallest(10, 'anomaly_score')
    print(f"\n[ALERT] Top 10 anomalies les plus graves:")
    for _, row in top_anomalies.iterrows():
        print(f"   -> [{row['machine_id']}] {row['timestamp']} | "
              f"Power: {row['power_kw']}kW | Temp: {row['temperature_c']}C | "
              f"Score: {row['anomaly_score']:.3f}")
    
    # Sauvegarder le modèle
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump({
        'model': iso_forest, 
        'label_encoder': le, 
        'features': features
    }, model_path)
    print(f"\n[SAVED] Modele sauvegarde dans {model_path}")
    
    return iso_forest

if __name__ == '__main__':
    train_anomaly_detector()
