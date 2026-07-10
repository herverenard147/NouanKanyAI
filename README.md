# ECOSIRA AI — Architecture Modulaire & Squelette de Fichiers 

Ce dépôt contient la structure de dossiers et de fichiers de base pour le projet **ECOSIRA AI**. 

Tous les fichiers de code Python (`.py`) ont été volontairement vidés afin que l'équipe de développement (4 personnes) puisse écrire l'intégralité du code à partir d'une feuille blanche, tout en respectant cette structure commune.

---

##  Description des Dossiers et des Fichiers

Voici le rôle de chaque dossier et de chaque fichier à implémenter :

###  1. `data/` (Données de Configuration)
*   `tariff_schema_generic.json` : Schéma JSON standard pour définir la structure de prix de l'électricité (paliers, tranches horaires, taxes).
*   `cie_tariffs.json` : Modèle de données tarifaires réel de la CIE (Côte d'Ivoire) basé sur le schéma générique.

###  2. `processing/` (Traitement de Données & Calculs - Développeur 1)
*   `utils.py` : Fonctions utilitaires communes pour charger/sauvegarder les fichiers JSON ou manipuler les données.
*   `tariff_engine.py` : Moteur de calcul de la facturation d'électricité en fonction des kilowattheures (kWh) consommés (tarifs résidentiels par paliers et tarifs PME par heures creuses/pleines).

###  3. `sensors/` (Simulateur de Capteurs / IoT - Développeur 1)
*   `sensor_simulator.py` : Module de simulation de relevés météo (température, humidité d'Abidjan) et de relevés de compteurs électriques intelligents en direct.

###  4. `ai/` (Intelligence Artificielle - Développeurs 2 et 3)
*   `predict_engine.py` : Moteur prédictif d'énergie basé sur XGBoost. Il doit inclure la préparation des données d'entraînement (feature engineering), l'apprentissage du modèle et l'explicabilité locale avec SHAP. (Développeur 2)
*   `base44_client.py` : Client HTTP pour communiquer avec l'API générative Base44 (pour formuler les explications). (Développeur 3)
*   `generation_backend.py` : Gestionnaire de basculement entre les backends d'explication (prompts locaux hors-ligne, LLM générique ou API Base44 Premium). (Développeur 3)
*   `prescriptive_engine.py` : Moteur qui génère les recommandations concrètes d'économie d'énergie et applique des filtres/garde-fous anti-hallucination stricts basés sur les tarifs réels de la CIE. (Développeur 3)

###  5. `tests/` (Vérification et Qualité - Tous / QA)
*   `test_structure.py` : Tests unitaires à écrire pour valider le comportement et les calculs des différents modules.

###  Fichiers Racines
*   `app.py` : Point d'entrée de l'application. Contient l'interface graphique interactive réalisée avec Streamlit (Développeur 4).
*   `requirements.txt` : Liste des dépendances Python requises pour le projet (xgboost, shap, streamlit, pandas, plotly, requests, scikit-learn).
*   `README.md` : Le présent guide explicatif.
