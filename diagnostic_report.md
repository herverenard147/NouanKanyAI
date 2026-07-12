# 🔍 Diagnostic Complet — NouanKanyAI

## 🎯 Ce que fait votre application

**NouanKanyAI** est une **plateforme intelligente de gestion et d'optimisation énergétique**, destinée aux entreprises, hôtels et industriels en **Côte d'Ivoire** (et Afrique francophone). Elle utilise l'**Intelligence Artificielle** pour analyser la consommation électrique, détecter les anomalies et générer des économies.

---

## 🏗️ Architecture Globale

```
NouanKanyAI/
├── frontend/          ← Interface Web (Next.js + TypeScript)
│   └── src/app/
│       ├── page.tsx           ← Page d'accueil (carrousel + modale d'auth)
│       └── dashboard/         ← Espace utilisateur connecté
│           ├── page.tsx       ← Tableau de bord principal
│           ├── sites/         ← Gestion des sites industriels
│           ├── appareils/     ← Gestion des machines/appareils
│           ├── predictions/   ← Assistant IA (chatbot Gemini)
│           ├── facturation/   ← Calcul des économies & factures
│           └── admin/         ← Panneau d'administration
│
├── backend/           ← API Intelligente (Python FastAPI)
│   ├── main.py                ← Serveur API (port 8000)
│   ├── ml/
│   │   ├── train_xgboost.py   ← Entraîne le modèle de prédiction
│   │   ├── train_anomaly.py   ← Entraîne le modèle de détection
│   │   ├── recommendation_engine.py ← Moteur de recommandations IA
│   │   └── models/            ← Modèles ML sauvegardés (.pkl)
│   └── data/
│       ├── synthetic_data.py  ← Catalogue d'appareils & données
│       └── cie_tariffs.json   ← Grille tarifaire CIE (réelle)
```

---

## ⚙️ Les Deux Serveurs qui tournent

| Serveur | Technologie | Port | Rôle |
|---|---|---|---|
| **Frontend** | Next.js (React) | `3000` | Interface visuelle |
| **Backend** | FastAPI (Python) | `8000` | API IA + données |

---

## 🤖 Modules d'Intelligence Artificielle

### 1. Modèle XGBoost — Prédiction de consommation
> Prédit la consommation électrique future (en kW) d'une machine en fonction de sa température, vibration, pression, et du contexte horaire.

**Entrées :** `température`, `vibration`, `pression`, `heure du jour`, `jour de la semaine`
**Sortie :** `consommation prédite en kW` pour les N prochaines heures + coût estimé en FCFA

### 2. Isolation Forest — Détection d'anomalies
> Détecte si une machine se comporte de manière anormale (surchauffe, surconsommation).

**Entrées :** Lectures de capteurs en temps réel
**Sortie :** `is_anomaly: true/false` + niveau de sévérité (critique / modérée / faible)

### 3. Moteur de Recommandations hybride
> Combine les deux modèles ci-dessus + des **règles métier** pour générer des actions concrètes.

Règles intégrées :
- ⚡ **Surconsommation** : si la puissance actuelle > 120% de la prédiction → Alerte + calcul du gain possible
- 🕐 **Délestage préventif** : si on est entre 10h-16h (heures de pointe) et la machine est basse priorité → Suggestion de mise en veille
- 🌡️ **Surchauffe** : si température > 60°C → Alerte critique + inspection

### 4. Chatbot "NouanKanyAI Copilot" (API Gemini)
> Un assistant IA conversationnel alimenté par Google Gemini Flash. L'utilisateur peut poser des questions en langage naturel sur ses machines et consommations.

---

## 💰 Modèle de Facturation et Tarification

L'application intègre la **vraie grille tarifaire de la CIE** (Compagnie Ivoirienne d'Électricité) :

| Tranche | Consommation | Prix/kWh |
|---|---|---|
| Sociale | 0 – 80 kWh | **36 FCFA** |
| Domestique | 81 – 150 kWh | **45 FCFA** |
| Non Domestique | 151 – 500 kWh | **68 FCFA** |
| Professionnelle | > 500 kWh | **95 FCFA** |

**Modèle économique :** NouanKanyAI génère des économies pour ses clients, puis prend **10% de ces économies** comme commission (modèle "Gain-Share").

---

## 🗄️ Base de Données (Supabase)

Tables identifiées dans l'API :
- `machines` — Catalogue des équipements (nom, puissance, statut, priorité)
- `sensor_metrics` — Historique des lectures de capteurs en temps réel
- `sites` — Sites industriels gérés par le client
- `audit_logs` — Journalisation de toutes les actions (traçabilité)
- `invoices` — Historique des factures générées

L'authentification utilisateur est assurée par **Supabase Auth** (email/password).

---

## 📊 Fonctionnalités du Dashboard

| Section | Ce qu'elle fait |
|---|---|
| **Tableau de Bord** | Vue globale : consommation totale en kW, graphique par heure, liste des machines et leur état en temps réel (rafraîchi toutes les 5 secondes) |
| **Sites** | Gestion des sites industriels (usines, hôtels) du client |
| **Appareils** | Ajout/suppression de machines, catalogue d'appareils avec puissances |
| **Assistant IA** | Chat avec le Copilot Gemini + visualisation des prédictions XGBoost |
| **Facturation** | Calcul dynamique des économies générées + historique des factures + audit trail blockchain |
| **Admin** | Métriques globales de la plateforme, santé des modèles ML, revenu de la plateforme |

---

## 📋 Abonnements proposés

| Plan | Cible | Prix/mois | Fonctionnalités clés |
|---|---|---|---|
| **Découverte** | Particulier | Gratuit | 3 appareils, rapport mensuel |
| **Essentiel** | Particulier | 2 900 FCFA | 10 appareils, alertes, prédictions |
| **Optimum** | Business | 7 900 FCFA | Illimité, IA avancée, détection anomalies |
| **Business** | Industriel | 19 900 FCFA | Multi-sites, API, support 24/7, audit IA |

---

## ✅ Forces du projet

- ✅ Architecture full-stack moderne et complète
- ✅ Deux vrais modèles de Machine Learning entraînés
- ✅ Tarification réelle CIE intégrée (données locales crédibles)
- ✅ Modèle économique "Gain-Share" clair et innovant
- ✅ Chatbot IA Gemini opérationnel
- ✅ Interface visuelle premium et immersive

## ⚠️ Points à améliorer → ✅ Corrigés

> Ces points ont été adressés le 12/07/2026. Les données réelles viendront quand la collecte IoT physique sera en place.

| Problème | Solution appliquée | Statut |
|---|---|---|
| Dashboard statique (graphique hardcodé) | Graphique généré dynamiquement selon la puissance totale des vraies machines Supabase | ✅ Corrigé |
| Économies hardcodées à `14.2M XOF` | Calcul dynamique : `puissance_totale × 24h × 30j × tarif_CIE × 15%` | ✅ Corrigé |
| Graphique de dérive ML (driftData) figé | Généré dynamiquement à partir du MAPE réel retourné par l'API backend | ✅ Corrigé |
| Alerte admin "noeud A-12" toujours affichée | Alerte conditionnelle : verte si tout va bien, rouge si DB ou blockchain déconnectés | ✅ Corrigé |
| Pas de données IoT physiques | Non applicable — simulation réaliste en place jusqu'à intégration de capteurs réels | 🔜 En attente |
