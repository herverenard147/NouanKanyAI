"""
equipment_catalog.py — Catalogue de référence des équipements industriels.

Pour chaque catégorie d'appareil, on référence plusieurs marques avec un indice
de consommation relatif (1.0 = référence). Ça permet à l'utilisateur de
sélectionner un modèle existant (au lieu de saisir une puissance à la main),
et au moteur de recommandations de proposer une alternative plus économe de
la même catégorie quand un appareil consomme plus que nécessaire.
"""

# (catégorie, [(marque, efficacité, indice_consommation, [(modèle, puissance_kw), ...]), ...])
_CATEGORIES = [
    ("Groupe Électrogène", [
        ("PowerMax", "faible", 1.35, [("PM-300", 300), ("PM-600", 600), ("PM-1200", 1200)]),
        ("EcoGen", "haute", 0.85, [("EG-300i", 300), ("EG-600i", 600), ("EG-1200i", 1200)]),
    ]),
    ("Climatiseur Central", [
        ("CoolBreeze", "faible", 1.30, [("CB-20", 20), ("CB-60", 60), ("CB-120", 120)]),
        ("EcoAir", "haute", 0.80, [("EA-20", 20), ("EA-60", 60), ("EA-120", 120)]),
    ]),
    ("Compresseur d'Air", [
        ("AirForce", "faible", 1.30, [("AF-15", 15), ("AF-45", 45), ("AF-90", 90)]),
        ("GreenAir", "haute", 0.82, [("GA-15", 15), ("GA-45", 45), ("GA-90", 90)]),
    ]),
    ("Four Industriel", [
        ("ThermoMax", "faible", 1.35, [("TM-80", 80), ("TM-300", 300), ("TM-600", 600)]),
        ("EcoBake", "haute", 0.83, [("EB-80", 80), ("EB-300", 300), ("EB-600", 600)]),
    ]),
    ("Chaudière Industrielle", [
        ("HeatCorp", "faible", 1.32, [("HC-100", 100), ("HC-400", 400), ("HC-800", 800)]),
        ("EcoTherm", "haute", 0.84, [("ET-100", 100), ("ET-400", 400), ("ET-800", 800)]),
    ]),
    ("Pompe Hydraulique", [
        ("HydroPro", "faible", 1.28, [("HP-5", 5), ("HP-20", 20), ("HP-45", 45)]),
        ("AquaSave", "haute", 0.82, [("AS-5", 5), ("AS-20", 20), ("AS-45", 45)]),
    ]),
    ("Chambre Froide", [
        ("FreezeTech", "faible", 1.30, [("FT-20", 20), ("FT-80", 80), ("FT-150", 150)]),
        ("EcoFroid", "haute", 0.81, [("EF-20", 20), ("EF-80", 80), ("EF-150", 150)]),
    ]),
    ("Convoyeur de Production", [
        ("ConveyMax", "faible", 1.25, [("CM-10", 10), ("CM-40", 40), ("CM-70", 70)]),
        ("EcoBelt", "haute", 0.85, [("EB2-10", 10), ("EB2-40", 40), ("EB2-70", 70)]),
    ]),
    ("Presse Hydraulique", [
        ("PressPro", "faible", 1.30, [("PP-25", 25), ("PP-90", 90), ("PP-180", 180)]),
        ("EcoPress", "haute", 0.83, [("EP-25", 25), ("EP-90", 90), ("EP-180", 180)]),
    ]),
    ("Séchoir Industriel", [
        ("DryMax", "faible", 1.30, [("DM-40", 40), ("DM-120", 120), ("DM-250", 250)]),
        ("EcoDry", "haute", 0.82, [("ED-40", 40), ("ED-120", 120), ("ED-250", 250)]),
    ]),
    ("Ascenseur Industriel", [
        ("LiftPro", "faible", 1.20, [("LP-8", 8), ("LP-20", 20), ("LP-35", 35)]),
        ("EcoLift", "haute", 0.85, [("EL-8", 8), ("EL-20", 20), ("EL-35", 35)]),
    ]),
    ("Ventilateur Extracteur", [
        ("AirFlow", "faible", 1.30, [("AFL-5", 5), ("AFL-20", 20), ("AFL-40", 40)]),
        ("EcoFan", "haute", 0.80, [("EF3-5", 5), ("EF3-20", 20), ("EF3-40", 40)]),
    ]),
    ("Éclairage LED (Parc)", [
        ("LumaTech", "faible", 1.15, [("LT-3", 3), ("LT-12", 12), ("LT-25", 25)]),
        ("EcoLuma", "haute", 0.75, [("EL2-3", 3), ("EL2-12", 12), ("EL2-25", 25)]),
    ]),
    ("Broyeur Industriel", [
        ("CrushMax", "faible", 1.30, [("CX-30", 30), ("CX-100", 100), ("CX-200", 200)]),
        ("EcoCrush", "haute", 0.83, [("EC-30", 30), ("EC-100", 100), ("EC-200", 200)]),
    ]),
    ("Turbine à Vapeur", [
        ("SteamCorp", "faible", 1.30, [("SC-300", 300), ("SC-1000", 1000), ("SC-2000", 2000)]),
        ("EcoTurbine", "haute", 0.84, [("ET2-300", 300), ("ET2-1000", 1000), ("ET2-2000", 2000)]),
    ]),
]

CATALOG = {}
for _categorie, _marques in _CATEGORIES:
    CATALOG[_categorie] = {}
    for _marque, _efficacite, _indice, _modeles in _marques:
        CATALOG[_categorie][_marque] = {
            "efficacite": _efficacite,
            "indice_consommation": _indice,
            "modeles": {_modele: {"puissance_kw": _p} for _modele, _p in _modeles},
        }


def get_catalog_tree():
    """Arborescence catégorie -> marque -> modèles, pour peupler les listes déroulantes du formulaire."""
    tree = {}
    for categorie, marques in CATALOG.items():
        tree[categorie] = {}
        for marque, info in marques.items():
            tree[categorie][marque] = {
                "efficacite": info["efficacite"],
                "modeles": [
                    {"nom": modele, "puissance_kw": data["puissance_kw"]}
                    for modele, data in info["modeles"].items()
                ],
            }
    return tree


def lookup(categorie: str, marque: str, modele: str):
    """Retourne la puissance nominale d'un modèle catalogué, ou None si introuvable."""
    entry = CATALOG.get(categorie, {}).get(marque, {}).get("modeles", {}).get(modele)
    if not entry:
        return None
    return {
        "puissance_kw": entry["puissance_kw"],
        "efficacite": CATALOG[categorie][marque]["efficacite"],
    }


def find_efficient_alternative(categorie: str, marque: str):
    """
    Cherche, dans la même catégorie, une marque plus économe que `marque`.
    Retourne (marque_alternative, indice_actuel, indice_alternatif) ou None.
    """
    marques = CATALOG.get(categorie)
    if not marques or marque not in marques:
        return None
    current = marques[marque]
    if current["efficacite"] == "haute":
        return None
    best = None
    for alt_marque, info in marques.items():
        if alt_marque == marque:
            continue
        if best is None or info["indice_consommation"] < best[1]["indice_consommation"]:
            best = (alt_marque, info)
    if not best or best[1]["indice_consommation"] >= current["indice_consommation"]:
        return None
    return best[0], current["indice_consommation"], best[1]["indice_consommation"]
