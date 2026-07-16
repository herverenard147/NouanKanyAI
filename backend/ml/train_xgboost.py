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
import json
import os
from datetime import datetime, timezone

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
    
    # Évaluation sur le jeu de test tenu à l'écart de l'entraînement.
    y_pred = model.predict(X_test)
    mae_kw = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    # MAPE avec protection contre les zéros (division par zéro possible si une
    # vraie valeur y_test est très proche de 0).
    nonzero_mask = y_test.abs() > 1e-3
    if nonzero_mask.sum() > 0:
        mape_pct = (
            (y_test[nonzero_mask] - y_pred[nonzero_mask]).abs()
            / y_test[nonzero_mask].abs()
        ).mean() * 100
    else:
        mape_pct = None  # dataset dégénéré, MAPE non calculable

    print(f"\n[RESULT] Resultats du modele (regresseur — pas de notion d'accuracy) :")
    print(f"   -> R2: {r2:.4f}")
    print(f"   -> MAE: {mae_kw:.3f} kW")
    print(f"   -> MAPE: {mape_pct:.2f}%" if mape_pct is not None else "   -> MAPE: non calculable (dataset degenere)")

    # Importance des features
    print(f"\n[FEATURES] Importance des variables:")
    importance = dict(zip(features, model.feature_importances_))
    for feat, imp in sorted(importance.items(), key=lambda x: x[1], reverse=True):
        print(f"   -> {feat}: {imp:.3f}")
    
    # Sauvegarder le modèle et l'encodeur — uniquement atteint après un fit + une
    # évaluation complets et réussis (aucune exception avant ce point). Un train
    # qui échoue en cours de route ne touche jamais ce fichier ni le JSON de
    # métriques ci-dessous : les valeurs précédentes restent en place.
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump({'model': model, 'label_encoder': le, 'features': features}, model_path)
    print(f"\n[SAVED] Modele sauvegarde dans {model_path}")

    # Métriques persistées à côté du .pkl, lues par le backend au démarrage
    # (voir load_models() dans main.py) — jamais recalculées à la volée.
    metrics_path = os.path.join(os.path.dirname(model_path), 'xgboost_metrics.json')
    metrics = {
        "r2": float(r2),
        "mae_kw": float(mae_kw),
        "mape_pct": float(mape_pct) if mape_pct is not None else None,
        "dataset": "synthetic",
        "computed_at": datetime.now(timezone.utc).isoformat(),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
    }
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"[SAVED] Metriques du modele sauvegardees dans {metrics_path}")

    return model, le

if __name__ == '__main__':
    train_prediction_model()
