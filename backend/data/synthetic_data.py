"""
EnergAI — Données synthétiques réalistes pour la démo.
Génère des profils d'appareils, historiques de consommation et anomalies.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ── Catalogue d'appareils avec puissances moyennes (kW) ──────────────────
CATALOGUE_APPAREILS = {
    "Climatisation": [
        {"nom": "Climatiseur Split 1.5CV", "puissance_kw": 1.2, "icone": ""},
        {"nom": "Climatiseur Split 2CV", "puissance_kw": 1.8, "icone": ""},
        {"nom": "Ventilateur plafonnier", "puissance_kw": 0.075, "icone": ""},
        {"nom": "Ventilateur sur pied", "puissance_kw": 0.055, "icone": ""},
    ],
    "Réfrigération": [
        {"nom": "Réfrigérateur standard", "puissance_kw": 0.15, "icone": ""},
        {"nom": "Congélateur coffre", "puissance_kw": 0.2, "icone": ""},
        {"nom": "Réfrigérateur américain", "puissance_kw": 0.35, "icone": ""},
    ],
    "Cuisine": [
        {"nom": "Four micro-ondes", "puissance_kw": 1.0, "icone": ""},
        {"nom": "Cuisinière électrique", "puissance_kw": 2.0, "icone": ""},
        {"nom": "Bouilloire électrique", "puissance_kw": 1.5, "icone": ""},
        {"nom": "Robot mixeur", "puissance_kw": 0.5, "icone": ""},
    ],
    "Éclairage": [
        {"nom": "Ampoule LED (lot de 5)", "puissance_kw": 0.05, "icone": ""},
        {"nom": "Ampoule incandescente (lot de 5)", "puissance_kw": 0.3, "icone": ""},
        {"nom": "Tube néon", "puissance_kw": 0.036, "icone": ""},
    ],
    "Multimédia": [
        {"nom": "Téléviseur LED 43\"", "puissance_kw": 0.08, "icone": ""},
        {"nom": "Téléviseur LED 55\"", "puissance_kw": 0.12, "icone": ""},
        {"nom": "Décodeur / Box internet", "puissance_kw": 0.025, "icone": ""},
        {"nom": "Ordinateur portable", "puissance_kw": 0.065, "icone": ""},
        {"nom": "Console de jeux", "puissance_kw": 0.15, "icone": ""},
    ],
    "Eau chaude": [
        {"nom": "Chauffe-eau électrique 50L", "puissance_kw": 1.5, "icone": ""},
        {"nom": "Chauffe-eau électrique 100L", "puissance_kw": 2.0, "icone": ""},
    ],
    "Lavage": [
        {"nom": "Machine à laver 7kg", "puissance_kw": 0.5, "icone": ""},
        {"nom": "Fer à repasser", "puissance_kw": 1.0, "icone": ""},
        {"nom": "Sèche-linge", "puissance_kw": 2.5, "icone": ""},
    ],
    "Business / Industriel": [
        {"nom": "Chambre froide", "puissance_kw": 5.0, "icone": ""},
        {"nom": "Compresseur industriel", "puissance_kw": 3.5, "icone": ""},
        {"nom": "Éclairage commercial (lot)", "puissance_kw": 0.8, "icone": ""},
        {"nom": "Système de vidéosurveillance", "puissance_kw": 0.3, "icone": ""},
    ],
}


def get_categories():
    """Retourne la liste des catégories d'appareils."""
    return list(CATALOGUE_APPAREILS.keys())


def get_appareils_par_categorie(categorie):
    """Retourne la liste des appareils pour une catégorie donnée."""
    return CATALOGUE_APPAREILS.get(categorie, [])


def get_all_appareils_flat():
    """Retourne tous les appareils dans une liste plate."""
    result = []
    for cat, appareils in CATALOGUE_APPAREILS.items():
        for app in appareils:
            result.append({**app, "categorie": cat})
    return result


def generer_historique_consommation(appareils_utilisateur, nb_jours=30):
    """
    Génère un historique de consommation réaliste basé sur les appareils déclarés.
    
    Args:
        appareils_utilisateur: liste de dicts {"nom", "puissance_kw", "quantite", "heures_jour"}
        nb_jours: nombre de jours d'historique
    
    Returns:
        DataFrame avec colonnes: date, consommation_kwh, cout_fcfa, prediction_kwh
    """
    if not appareils_utilisateur:
        appareils_utilisateur = [
            {"nom": "Climatiseur Split 1.5CV", "puissance_kw": 1.2, "quantite": 2, "heures_jour": 8},
            {"nom": "Réfrigérateur standard", "puissance_kw": 0.15, "quantite": 1, "heures_jour": 24},
            {"nom": "Téléviseur LED 43\"", "puissance_kw": 0.08, "quantite": 1, "heures_jour": 5},
            {"nom": "Ampoule LED (lot de 5)", "puissance_kw": 0.05, "quantite": 2, "heures_jour": 6},
            {"nom": "Four micro-ondes", "puissance_kw": 1.0, "quantite": 1, "heures_jour": 0.5},
            {"nom": "Machine à laver 7kg", "puissance_kw": 0.5, "quantite": 1, "heures_jour": 1},
        ]

    # Calculer la consommation de base quotidienne
    conso_base = sum(
        a["puissance_kw"] * a["quantite"] * a["heures_jour"]
        for a in appareils_utilisateur
    )

    dates = []
    consommations = []
    predictions = []
    couts = []

    today = datetime.now()

    for i in range(nb_jours, 0, -1):
        date = today - timedelta(days=i)
        dates.append(date.strftime("%Y-%m-%d"))

        # Variation réaliste : weekend = +15%, nuit fraîche = -10%, aléatoire ±20%
        facteur = 1.0
        if date.weekday() >= 5:  # Weekend
            facteur += 0.15
        
        # Simulation de chaleur (plus de clim en milieu de mois)
        facteur += 0.1 * np.sin(2 * np.pi * i / 30)
        
        # Bruit aléatoire
        facteur += np.random.normal(0, 0.12)
        facteur = max(0.5, facteur)

        conso = conso_base * facteur
        consommations.append(round(conso, 2))

        # Prédiction (légèrement lissée, avec un petit décalage)
        pred = conso_base * (1 + 0.05 * np.sin(2 * np.pi * i / 30))
        pred += np.random.normal(0, conso_base * 0.05)
        predictions.append(round(pred, 2))

        # Calcul du coût CIE simplifié
        cout = calculer_cout_cie(conso)
        couts.append(round(cout, 0))

    df = pd.DataFrame({
        "date": dates,
        "consommation_kwh": consommations,
        "prediction_kwh": predictions,
        "cout_fcfa": couts,
    })
    df["date"] = pd.to_datetime(df["date"])
    return df


def calculer_cout_cie(kwh_jour):
    """Calcule le coût CIE pour une consommation journalière en kWh."""
    kwh_mois_equiv = kwh_jour * 30

    if kwh_mois_equiv <= 80:
        return kwh_jour * 36.24
    elif kwh_mois_equiv <= 150:
        return kwh_jour * 45.83
    elif kwh_mois_equiv <= 500:
        return kwh_jour * 68.44
    else:
        return kwh_jour * 95.68


def generer_alertes(df, seuil_fcfa=3000):
    """Génère des alertes basées sur l'historique de consommation."""
    alertes = []
    
    for _, row in df.iterrows():
        # Alerte surconsommation
        if row["consommation_kwh"] > row["prediction_kwh"] * 1.25:
            alertes.append({
                "type": "Surconsommation",
                "message": f"Consommation {row['consommation_kwh']:.1f} kWh détectée, "
                           f"soit +{((row['consommation_kwh']/row['prediction_kwh'])-1)*100:.0f}% "
                           f"au-dessus de la prédiction",
                "date": row["date"].strftime("%d/%m/%Y"),
                "severite": "haute",
                "lu": False,
            })
        
        # Alerte coût
        if row["cout_fcfa"] > seuil_fcfa:
            alertes.append({
                "type": "Coût élevé",
                "message": f"Coût journalier de {row['cout_fcfa']:,.0f} FCFA, "
                           f"seuil de {seuil_fcfa:,.0f} FCFA dépassé",
                "date": row["date"].strftime("%d/%m/%Y"),
                "severite": "moyenne",
                "lu": False,
            })
    
    # Ajouter des recommandations IA
    alertes.append({
        "type": "Recommandation",
        "message": "Décaler l'utilisation du chauffe-eau aux heures creuses "
                   "pourrait réduire votre facture de 12%",
        "date": datetime.now().strftime("%d/%m/%Y"),
        "severite": "info",
        "lu": False,
    })
    alertes.append({
        "type": "Recommandation",
        "message": "Votre climatiseur consomme 45% de votre énergie. "
                   "Régler la température à 25°C au lieu de 22°C économiserait ~8 500 FCFA/mois",
        "date": datetime.now().strftime("%d/%m/%Y"),
        "severite": "info",
        "lu": False,
    })

    return alertes[-10:]  # Garder les 10 dernières
