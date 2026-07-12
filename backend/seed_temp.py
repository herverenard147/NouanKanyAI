"""
seed_temp.py — Script temporaire de génération de 100 comptes de démonstration
avec des sites et machines réalistes. Supprimé après exécution.
"""

import random
import uuid

import models_db as models
from auth import hash_password

SHARED_PASSWORD = "Demo@NK2026"

FIRST_NAMES = [
    "Kouassi", "Aya", "Yao", "Adjoua", "Koffi", "Akissi", "N'Guessan", "Affoué", "Konan",
    "Amenan", "Kouadio", "Ahou", "Brou", "Adjoba", "Kobenan", "Akoua", "Assi", "Kadio", "Kanga", "Awa",
    "Fatoumata", "Mamadou", "Ibrahim", "Aminata", "Sékou", "Awoulath", "Moussa", "Aïcha", "Bakary",
    "Salimata", "Jean", "Marie", "Pierre", "Claire", "Michel", "Isabelle", "Paul", "Sophie", "Éric",
    "Nathalie", "Serge", "Chantal", "Bernard", "Christiane", "Roger", "Henriette", "Georges", "Solange",
    "Emmanuel", "Béatrice",
]

LAST_NAMES = [
    "Kouamé", "Diabaté", "Ouattara", "Bamba", "Koné", "Traoré", "Kouassi", "Aka", "N'Dri",
    "Assemien", "Kramo", "Djédjé", "Zadi", "Ehouman", "Amani", "Coulibaly", "Sangaré", "Fofana", "Silué",
    "Touré", "Dosso", "Camara", "Yéo", "Soro", "Gouiné", "Kobena", "Adou", "Angoua", "Tanoh",
]

COMPANIES = [
    "SOLIBRA", "Nestlé Côte d'Ivoire", "PALMCI", "SIFCA", "Ivoire Coton", "UNIWAX", "Filtisac",
    "CIPREL", "Azito Energie", "SODECI", "Michelin Côte d'Ivoire", "SAPH", "Trituraf", "SANIA Cie",
    "Cargill Côte d'Ivoire", "Olam Côte d'Ivoire", "LDC Côte d'Ivoire", "Cemoi Chocolatier CI",
    "SIR - Société Ivoirienne de Raffinage", "Groupe Prosuma", "CFAO Industries", "Sivac", "SITAB",
    "Hôtel Ivoire", "Hôtel Pullman Abidjan", "Sofitel Abidjan", "Novotel Abidjan",
    "Azalaï Hôtel Abidjan", "Radisson Blu Abidjan", "Complexe Industriel de Yopougon",
    "Zone Industrielle Vridi", "Zone Industrielle Koumassi", "Blohorn Industries",
    "Unilever Côte d'Ivoire", "Nouvelle Cotonnière Ivoirienne", "Groupe Bolloré CI",
    "Filature Utexi", "SIPRA", "Ivoire Aluminium", "Manufacture Ivoirienne de Cigarettes",
    "Vitib Grand-Bassam", "Sucrivoire", "Trituraf Bouaké",
]

CITIES = [
    "Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro", "Korhogo", "Daloa", "Man", "Gagnoa",
    "Divo", "Abengourou", "Agboville", "Grand-Bassam", "Anyama", "Bingerville", "Dabou", "Soubré",
    "Odienné", "Ferkessédougou", "Bondoukou", "Adzopé",
]

MACHINE_TYPES = [
    ("Groupe Électrogène", 150, 1200),
    ("Climatiseur Central", 20, 120),
    ("Compresseur d'Air", 15, 90),
    ("Four Industriel", 80, 600),
    ("Chaudière Industrielle", 100, 800),
    ("Pompe Hydraulique", 5, 45),
    ("Chambre Froide", 20, 150),
    ("Convoyeur de Production", 10, 70),
    ("Presse Hydraulique", 25, 180),
    ("Séchoir Industriel", 40, 250),
    ("Ascenseur Industriel", 8, 35),
    ("Ventilateur Extracteur", 5, 40),
    ("Éclairage LED (Parc)", 3, 25),
    ("Broyeur Industriel", 30, 200),
    ("Turbine à Vapeur", 300, 2000),
]

TYPE_COMPTE_CHOICES = ["Particulier", "Entreprise", "Industriel"]
TYPE_COMPTE_WEIGHTS = [0.2, 0.4, 0.4]


def _slug(s: str) -> str:
    repl = {"é": "e", "è": "e", "ê": "e", "à": "a", "â": "a", "î": "i", "ô": "o", "û": "u", "ç": "c", "'": "", " ": ""}
    out = s.lower()
    for k, v in repl.items():
        out = out.replace(k, v)
    return out


def run_seed(db, n_users: int = 100):
    created = []
    password_hash = hash_password(SHARED_PASSWORD)

    for i in range(n_users):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        nom = f"{first} {last}"
        email = f"{_slug(first)}.{_slug(last)}.{i+1}@nouankanyai-demo.ci"
        type_compte = random.choices(TYPE_COMPTE_CHOICES, weights=TYPE_COMPTE_WEIGHTS, k=1)[0]

        user = models.User(
            email=email,
            password_hash=password_hash,
            nom=nom,
            type_compte=type_compte,
            role=type_compte,
        )
        db.add(user)
        db.flush()

        n_sites = random.randint(1, 2)
        chosen_companies = random.sample(COMPANIES, n_sites)
        for company in chosen_companies:
            site = models.Site(
                nom=company,
                localisation=random.choice(CITIES),
                user_id=user.id,
            )
            db.add(site)
            db.flush()

            n_machines = random.randint(2, 5)
            for _ in range(n_machines):
                type_name, min_kw, max_kw = random.choice(MACHINE_TYPES)
                rated_kw = round(random.uniform(min_kw, max_kw), 1)
                is_alerte = random.random() < 0.15
                status = "alerte" if is_alerte else "actif"
                priority = random.choices(["basse", "moyenne", "haute"], weights=[0.3, 0.4, 0.3], k=1)[0]
                if is_alerte:
                    priority = random.choices(["moyenne", "haute"], weights=[0.3, 0.7], k=1)[0]

                code = f"NK-{uuid.uuid4().hex[:6].upper()}"
                machine = models.Machine(
                    code_interne=code,
                    nom=f"{type_name} {random.randint(1, 12):02d}",
                    puissance_nominale_kw=rated_kw,
                    status=status,
                    priority=priority,
                    site_id=site.id,
                    user_id=user.id,
                )
                db.add(machine)
                db.flush()

                if is_alerte:
                    power_kw = round(rated_kw * random.uniform(1.05, 1.35), 1)
                    temperature_c = round(random.uniform(70, 95), 1)
                    vibration_hz = round(random.uniform(35, 60), 1)
                    pressure_bar = round(random.uniform(3.5, 6.0), 1)
                else:
                    power_kw = round(rated_kw * random.uniform(0.5, 0.95), 1)
                    temperature_c = round(random.uniform(24, 45), 1)
                    vibration_hz = round(random.uniform(0.3, 3.0), 1)
                    pressure_bar = round(random.uniform(0.8, 2.5), 1)

                db.add(models.SensorMetric(
                    machine_id=machine.id,
                    power_kw=power_kw,
                    temperature_c=temperature_c,
                    vibration_hz=vibration_hz,
                    pressure_bar=pressure_bar,
                ))

        created.append({"email": email, "nom": nom, "type_compte": type_compte})

    db.commit()
    return created
