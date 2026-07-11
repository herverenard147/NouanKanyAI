"""
train_xgboost.py — Entraînement du modèle de prédiction de consommation
Utilise XGBoost pour prédire power_kw à partir des données de capteurs.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import joblib
import os

def train_prediction_model(data_path='backend/ml/data/sensor_data.csv', 
                            model_path='backend/ml/models/xgboost_model.pkl'):
    """
    Entraîne un modèle XGBoost pour prédire la consommation en kW.
    """
    print("[INFO] Chargement des donnees...")
    df = pd.read_csv(data_path)
    
    # On retire les anomalies pour l'entraînement (on veut prédire le comportement normal)
    df_clean = df[df['is_anomaly'] == 0].copy()
    print(f"   -> {len(df_clean)} lignes sans anomalies utilisees pour l'entrainement.")
    
    # Encoder les identifiants machine
    le = LabelEncoder()
    df_clean['machine_encoded'] = le.fit_transform(df_clean['machine_id'])
    
    # Features et Target
    features = ['temperature_c', 'vibration_hz', 'pressure_bar', 
                'hour_of_day', 'day_of_week', 'month', 'machine_encoded']
    target = 'power_kw'
    
    X = df_clean[features]
    y = df_clean[target]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"   -> Train: {len(X_train)} | Test: {len(X_test)}")
    
    # Entraînement XGBoost
    print("\n[TRAIN] Entrainement du modele XGBoost...")
    model = xgb.XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0
    )
    
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
    
    # Évaluation
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"\n[RESULT] Resultats du modele:")
    print(f"   -> MAE (Erreur Absolue Moyenne): {mae:.3f} kW")
    print(f"   -> R2 Score: {r2:.4f} ({r2*100:.1f}% de precision)")
    
    # Importance des features
    print(f"\n[FEATURES] Importance des variables:")
    importance = dict(zip(features, model.feature_importances_))
    for feat, imp in sorted(importance.items(), key=lambda x: x[1], reverse=True):
        print(f"   -> {feat}: {imp:.3f}")
    
    # Sauvegarder le modèle et l'encodeur
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump({'model': model, 'label_encoder': le, 'features': features}, model_path)
    print(f"\n[SAVED] Modele sauvegarde dans {model_path}")
    
    return model, le

if __name__ == '__main__':
    train_prediction_model()
