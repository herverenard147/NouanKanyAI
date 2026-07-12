<div align="center">

# ⚡ NouanKanyAI
### Plateforme Intelligente de Gestion Énergétique Industrielle

**La plateforme qui transforme votre facture d'électricité en avantage compétitif.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_15-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost-FF6600?style=for-the-badge)](https://xgboost.readthedocs.io)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)

</div>

---

## 🎯 Qu'est-ce que NouanKanyAI ?

**NouanKanyAI** est une plateforme SaaS full-stack de gestion et d'optimisation de la consommation électrique pour les entreprises, hôtels et industriels en **Côte d'Ivoire** et en Afrique francophone.

Elle combine :
- 📊 **Surveillance en temps réel** de toutes vos machines et équipements
- 🤖 **Intelligence Artificielle** (XGBoost + Isolation Forest) pour prédire et détecter les anomalies
- 💬 **Chatbot Gemini** pour des conseils en langage naturel
- 💰 **Calcul dynamique** des économies générées selon la grille tarifaire réelle de la **CIE**

> **Modèle économique :** NouanKanyAI génère des économies pour ses clients → prend **10% de ces économies** comme commission (Gain-Share). Vous ne payez que si vous économisez.

---

## ✨ Fonctionnalités Clés

### 🏠 Page d'Accueil Premium
- Carrousel d'images 3D futuristes en arrière-plan (défilement automatique)
- Texte de présentation fixe avec effet **glassmorphism**
- Personnages 3D holographiques sur les côtés
- Modale d'inscription/connexion élégante en mode sombre
- Authentification complète via **Supabase Auth**

### 📊 Tableau de Bord Principal
- Consommation totale en kW (données temps réel depuis Supabase)
- **Graphique d'évolution journalier** généré dynamiquement selon la puissance réelle
- **Économies du mois** calculées : `puissance × 24h × 30j × tarif CIE × 15%`
- Carte des appareils les plus énergivores (actualisé toutes les 5 secondes)
- Alertes IA en temps réel (surchauffe, surconsommation)

### 🔌 Gestion des Équipements
- Vue grille de toutes vos machines avec statut en temps réel (Actif / Alerte / Hors ligne)
- Ajout d'équipements via modale (nom, puissance, quantité)
- **Simulation d'alerte** : déclenche une anomalie sur une machine pour tester le système
- Métriques par appareil : puissance kW, température °C, vibrations Hz
- Barre de progression des vibrations avec seuil d'alerte visuel

### 🤖 Assistant IA & Prédictions
- **Chatbot conversationnel** alimenté par Google Gemini Flash
- Historique de conversation persistant (localStorage)
- L'IA connaît l'état actuel de toutes vos machines en temps réel
- **Recommandations actionnables** générées automatiquement (triées par sévérité)
- 3 types de recommandations : `alerte`, `optimisation`, `délestage`
- Calcul du gain financier estimé en FCFA pour chaque recommandation

### 💰 Facturation & Audit
- Économies brutes et commission Gain-Share calculées côté serveur
- Graphique en barres des économies semaine par semaine
- Camembert de répartition (90% client / 10% NouanKanyAI)
- Piste d'audit cryptographique (audit trail)
- Historique des factures

### 🛡️ Centre de Contrôle Admin (MLOps)
- Métriques globales de la plateforme (sites, machines, revenus)
- **Santé des modèles IA** : précision XGBoost, MAPE, anomalies détectées
- Graphique de dérive du modèle (Model Drift) — généré dynamiquement
- État du système : API uptime, base de données, registre d'audit
- Alerte conditionnelle (verte si tout va bien, rouge si problème détecté)
- Bouton de réentraînement des modèles

---

## 🏗️ Architecture Technique

```
NouanKanyAI/
│
├── frontend/                     ← Interface Web (Next.js 15 + TypeScript)
│   ├── src/app/
│   │   ├── page.tsx              ← Page d'accueil (carrousel + auth modal)
│   │   ├── globals.css           ← Design system complet (glassmorphism, animations)
│   │   └── dashboard/
│   │       ├── layout.tsx        ← Sidebar + Header + Bouton déconnexion
│   │       ├── page.tsx          ← Tableau de bord principal
│   │       ├── appareils/        ← Gestion et surveillance des équipements
│   │       ├── predictions/      ← Assistant IA + Recommandations
│   │       ├── facturation/      ← Économies, Audit Trail, Factures
│   │       ├── sites/            ← Gestion multi-sites industriels
│   │       └── admin/            ← Panneau d'administration MLOps
│   └── public/                   ← Images 3D futuristes (hero carousel)
│
├── backend/                      ← API Intelligente (Python FastAPI)
│   ├── main.py                   ← Serveur API REST (port 8000)
│   ├── .env                      ← Variables d'environnement (Supabase, Gemini)
│   ├── ml/
│   │   ├── generate_data.py      ← Génère 1 an de données synthétiques réalistes
│   │   ├── train_xgboost.py      ← Entraîne le modèle de prédiction de consommation
│   │   ├── train_anomaly.py      ← Entraîne le modèle de détection d'anomalies
│   │   ├── recommendation_engine.py ← Moteur de recommandations hybride (IA + Règles)
│   │   └── models/               ← Modèles ML sauvegardés (.pkl)
│   └── data/
│       ├── synthetic_data.py     ← Catalogue d'appareils (150+ équipements)
│       └── cie_tariffs.json      ← Grille tarifaire officielle CIE (Côte d'Ivoire)
│
├── diagnostic_report.md          ← Rapport de diagnostic complet du projet
└── requirements.txt              ← Dépendances Python
```

---

## 🛠️ Stack Technologique

### Frontend
| Technologie | Version | Usage |
|---|---|---|
| **Next.js** | 15 | Framework React (App Router) |
| **TypeScript** | 5 | Typage statique |
| **Recharts** | 2 | Graphiques interactifs (BarChart, AreaChart, PieChart) |
| **Lucide React** | latest | Icônes vectorielles |
| **Supabase JS** | 2 | Client authentification & base de données |
| **Vanilla CSS** | — | Design system (glassmorphism, animations) |
| **Google Fonts** | — | Typographies Outfit & Inter |

### Backend
| Technologie | Version | Usage |
|---|---|---|
| **FastAPI** | latest | API REST asynchrone |
| **Uvicorn** | latest | Serveur ASGI |
| **XGBoost** | latest | Modèle de prédiction de consommation |
| **Scikit-learn** | latest | Isolation Forest + prétraitement |
| **Pandas / NumPy** | 2+ | Manipulation des données |
| **Joblib** | latest | Sérialisation des modèles ML |
| **Python-dotenv** | latest | Gestion des variables d'environnement |
| **Supabase Python** | latest | Client base de données |

### Services Cloud
| Service | Usage |
|---|---|
| **Supabase** | Base de données PostgreSQL + Authentification |
| **Google Gemini Flash** | Chatbot IA conversationnel |

### Modèles d'Intelligence Artificielle
| Modèle | Algorithme | Objectif |
|---|---|---|
| **XGBoost Regressor** | Gradient Boosting | Prédire la consommation (kW) sur N heures |
| **Isolation Forest** | Forêt d'isolement | Détecter les comportements anormaux |
| **Moteur de règles** | Règles métier hybrides | Délestage, surchauffe, surconsommation |

---

## 🚀 Installation et Démarrage

### Prérequis
- **Python** 3.10+
- **Node.js** 18+
- **npm** ou **yarn**
- Un compte **Supabase** (gratuit)
- Une clé API **Google Gemini** (gratuit)

---

### Étape 1 — Cloner le projet
```bash
git clone https://github.com/votre-user/NouanKanyAI.git
cd NouanKanyAI
```

### Étape 2 — Configurer les variables d'environnement
Créez ou modifiez le fichier `backend/.env` :
```env
# Clé API Google Gemini (https://aistudio.google.com)
GEMINI_API_KEY=votre_cle_gemini

# Supabase (https://supabase.com)
SUPABASE_URL=votre_project_ref
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### Étape 3 — Installer les dépendances Python
```bash
pip install fastapi uvicorn pydantic python-dotenv supabase xgboost scikit-learn pandas numpy joblib
```

### Étape 4 — Générer les données et entraîner les modèles IA
> Cette étape est **obligatoire** avant de lancer le backend.
```bash
# 1. Générer 1 an de données synthétiques réalistes
python backend/ml/generate_data.py

# 2. Entraîner le modèle de prédiction XGBoost
python backend/ml/train_xgboost.py

# 3. Entraîner le modèle de détection d'anomalies Isolation Forest
python backend/ml/train_anomaly.py
```

### Étape 5 — Lancer le Backend (API FastAPI)
```bash
python backend/main.py
# L'API tourne sur http://localhost:8000
# Documentation interactive : http://localhost:8000/docs
```

### Étape 6 — Installer les dépendances Frontend
```bash
cd frontend
npm install
```

### Étape 7 — Configurer Supabase pour le Frontend
Créez le fichier `frontend/src/lib/supabase.ts` :
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://VOTRE_PROJECT_REF.supabase.co'
const supabaseAnonKey = 'VOTRE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Étape 8 — Lancer le Frontend (Next.js)
```bash
# Depuis le dossier frontend/
npm run dev
# L'application tourne sur http://localhost:3000
```

---

## 🗄️ Structure de la Base de Données Supabase

| Table | Description |
|---|---|
| `machines` | Catalogue des équipements (nom, puissance_nominale_kw, status, priority) |
| `sensor_metrics` | Lectures de capteurs en temps réel (power_kw, temperature_c, vibration_hz, pressure_bar) |
| `sites` | Sites industriels gérés par le client |
| `audit_logs` | Journal d'audit cryptographique (timestamp, action, ref_hash, status) |
| `invoices` | Historique des factures générées (month, amount_xof) |

---

## 🔌 Endpoints API

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/` | Status de l'API |
| `GET` | `/api/machines` | Liste toutes les machines avec leurs métriques live |
| `POST` | `/api/machines` | Ajoute une ou plusieurs machines |
| `POST` | `/api/machines/{id}/simulate` | Simule une anomalie sur une machine |
| `GET` | `/api/facturation` | Données de facturation et économies calculées |
| `GET` | `/api/admin/metrics` | Métriques globales de la plateforme (admin) |
| `POST` | `/api/predict` | Prédit la consommation future d'une machine (XGBoost) |
| `POST` | `/api/anomaly` | Vérifie si des lectures sont anormales (Isolation Forest) |
| `POST` | `/api/recommend` | Génère des recommandations actionnables |
| `POST` | `/api/chat` | Chat avec l'assistant Gemini IA |

---

## 💰 Grille Tarifaire CIE (Intégrée)

| Tranche | Consommation | Prix/kWh |
|---|---|---|
| Sociale | 0 – 80 kWh | **36 FCFA** |
| Domestique | 81 – 150 kWh | **46 FCFA** |
| Non Domestique | 151 – 500 kWh | **68 FCFA** |
| Professionnelle | > 500 kWh | **96 FCFA** |

*(Source : tarifs officiels CIE Côte d'Ivoire)*

---

## 📋 Plans d'Abonnement

| Plan | Cible | Prix/mois | Fonctionnalités clés |
|---|---|---|---|
| **Découverte** | Particulier | Gratuit | 3 appareils, rapport mensuel |
| **Essentiel** | Particulier | 2 900 FCFA | 10 appareils, alertes, prédictions |
| **Optimum** | Business | 7 900 FCFA | Illimité, IA avancée, détection anomalies |
| **Business** | Industriel | 19 900 FCFA | Multi-sites, API, support 24/7, audit IA |

---

## 🔍 Diagnostic Complet

Consultez le fichier [diagnostic_report.md](./diagnostic_report.md) pour :
- L'état détaillé de chaque module
- L'analyse de la simulation des anomalies
- Les forces et limites du projet
- Les corrections déjà appliquées

---

## 📁 Structure des Modèles ML

```
backend/ml/
├── data/
│   └── sensor_data.csv         ← ~35 000 lignes (1 an × 4 machines × 24h)
└── models/
    ├── xgboost_model.pkl        ← Modèle XGBoost + LabelEncoder + features
    └── isolation_forest.pkl     ← Isolation Forest + LabelEncoder
```

**Performances du modèle XGBoost :**
- Précision : **~94.2%** (R² Score)
- MAPE : **~5.8%** (Erreur absolue moyenne en %)
- Entraîné sur données normales uniquement (anomalies exclues)

---

## 🤝 Contribution

1. Forkez le repository
2. Créez votre branche : `git checkout -b feature/ma-fonctionnalite`
3. Committez : `git commit -m 'feat: ajouter ma fonctionnalite'`
4. Pushez : `git push origin feature/ma-fonctionnalite`
5. Ouvrez une Pull Request

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier `LICENSE` pour plus de détails.

---

<div align="center">

**Fait avec ❤️ pour l'Afrique | NouanKanyAI © 2026**

*Optimisez votre énergie. Maximisez vos économies.*

</div>
