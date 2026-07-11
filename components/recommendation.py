"""
EnergAI — Moteur de recommandation de formule d'abonnement.
Évalue les appareils déclarés et le profil utilisateur pour recommander
la formule optimale parmi : Découverte, Essentiel, Optimum, Business.
"""


def recommander_formule(appareils, type_compte="Particulier"):
    """
    Applique les 4 règles de décision pour recommander une formule.
    
    Args:
        appareils: liste de dicts {"nom", "puissance_kw", "quantite", "categorie", ...}
        type_compte: "Particulier" ou "Business"
    
    Returns:
        dict avec {"formule_id", "formule_nom", "raison", "score_confiance"}
    """
    nb_appareils = sum(a.get("quantite", 1) for a in appareils)
    puissance_totale = sum(a.get("puissance_kw", 0) * a.get("quantite", 1) for a in appareils)
    
    # Compter les types spécifiques
    nb_climatiseurs = sum(
        a.get("quantite", 1) for a in appareils
        if "climatiseur" in a.get("nom", "").lower() or "clim" in a.get("nom", "").lower()
    )
    
    has_chambre_froide = any(
        "chambre froide" in a.get("nom", "").lower() or 
        "compresseur" in a.get("nom", "").lower()
        for a in appareils
    )
    
    has_equipement_lourd = has_chambre_froide or puissance_totale > 10
    
    # ── Règle 1 : Formule Business ─────────────────────────────
    if type_compte == "Business" and (has_equipement_lourd or puissance_totale > 8):
        return {
            "formule_id": "business",
            "formule_nom": "Business",
            "raison": _raison_business(has_chambre_froide, puissance_totale),
            "score_confiance": 95,
        }
    
    # ── Règle 2 : Formule Optimum ──────────────────────────────
    if nb_appareils >= 8 or nb_climatiseurs >= 2 or puissance_totale > 5:
        return {
            "formule_id": "optimum",
            "formule_nom": "Optimum",
            "raison": _raison_optimum(nb_appareils, nb_climatiseurs, puissance_totale),
            "score_confiance": 88,
        }
    
    # ── Règle 3 : Formule Essentiel ────────────────────────────
    if nb_appareils >= 3 and puissance_totale >= 1.5:
        return {
            "formule_id": "essentiel",
            "formule_nom": "Essentiel",
            "raison": _raison_essentiel(nb_appareils, puissance_totale),
            "score_confiance": 82,
        }
    
    # ── Règle 4 : Formule Découverte ───────────────────────────
    return {
        "formule_id": "decouverte",
        "formule_nom": "Découverte",
        "raison": "Profil de consommation léger — idéal pour découvrir EnergAI. "
                  "Ajoutez plus d'appareils pour débloquer des fonctionnalités avancées.",
        "score_confiance": 75,
    }


def _raison_business(has_chambre_froide, puissance_totale):
    """Génère la raison de la recommandation Business."""
    raisons = []
    if has_chambre_froide:
        raisons.append("équipement industriel détecté (chambre froide/compresseur)")
    if puissance_totale > 10:
        raisons.append(f"puissance totale élevée ({puissance_totale:.1f} kW)")
    raisons.append("compte Business avec besoins professionnels")
    return "Formule Business recommandée : " + ", ".join(raisons) + ". " \
           "Inclut le support prioritaire, l'audit énergétique et la gestion multi-sites."


def _raison_optimum(nb_appareils, nb_clim, puissance_totale):
    """Génère la raison de la recommandation Optimum."""
    raisons = []
    if nb_appareils >= 8:
        raisons.append(f"{nb_appareils} appareils déclarés")
    if nb_clim >= 2:
        raisons.append(f"{nb_clim} climatiseurs détectés")
    if puissance_totale > 5:
        raisons.append(f"puissance totale de {puissance_totale:.1f} kW")
    return "Formule Optimum recommandée : " + ", ".join(raisons) + ". " \
           "L'assistant prescriptif et la détection d'anomalies optimiseront votre consommation."


def _raison_essentiel(nb_appareils, puissance_totale):
    """Génère la raison de la recommandation Essentiel."""
    return f"Formule Essentiel recommandée : {nb_appareils} appareils, " \
           f"puissance totale de {puissance_totale:.1f} kW — consommation standard de ménage. " \
           "Les prédictions mensuelles et alertes de seuil vous aideront à maîtriser vos dépenses."


def calculer_economies_estimees(appareils, formule_id):
    """
    Estime les économies mensuelles potentielles en FCFA basées sur 
    les optimisations de la formule choisie.
    """
    puissance_totale = sum(a.get("puissance_kw", 0) * a.get("quantite", 1) for a in appareils)
    
    # Estimation de la consommation mensuelle en kWh (8h/jour moyen)
    conso_mensuelle = puissance_totale * 8 * 30
    
    # Coût estimé mensuel (tarif moyen 55 FCFA/kWh)
    cout_mensuel = conso_mensuelle * 55
    
    # Pourcentage d'économies selon la formule
    pct_economies = {
        "decouverte": 5,
        "essentiel": 12,
        "optimum": 22,
        "business": 30,
    }
    
    pct = pct_economies.get(formule_id, 5)
    economies = cout_mensuel * pct / 100
    
    return {
        "conso_mensuelle_kwh": round(conso_mensuelle, 1),
        "cout_mensuel_fcfa": round(cout_mensuel, 0),
        "economies_fcfa": round(economies, 0),
        "pct_economies": pct,
    }
