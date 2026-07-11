"""
EnergAI — Système d'authentification simulé (session Streamlit).
Gère connexion, inscription, profils Particulier/Business.
"""
import streamlit as st


# ── Base de données utilisateurs en mémoire ──────────────────────────────
DEFAULT_USERS = {
    "demo@energai.ci": {
        "nom": "Kouamé Serge",
        "email": "demo@energai.ci",
        "mot_de_passe": "demo123",
        "type_compte": "Particulier",
    },
    "business@energai.ci": {
        "nom": "Entreprise ABJ Services",
        "email": "business@energai.ci",
        "mot_de_passe": "business123",
        "type_compte": "Business",
    },
}


def init_auth():
    """Initialise les variables de session pour l'authentification."""
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False
    if "user" not in st.session_state:
        st.session_state.user = None
    if "users_db" not in st.session_state:
        st.session_state.users_db = DEFAULT_USERS.copy()
    if "appareils" not in st.session_state:
        st.session_state.appareils = []
    if "formule_recommandee" not in st.session_state:
        st.session_state.formule_recommandee = None
    if "abonnement_actif" not in st.session_state:
        st.session_state.abonnement_actif = "decouverte"
    if "alertes" not in st.session_state:
        st.session_state.alertes = []
    if "seuil_alerte_fcfa" not in st.session_state:
        st.session_state.seuil_alerte_fcfa = 3000
    if "langue" not in st.session_state:
        st.session_state.langue = "FR"


def login(email, mot_de_passe):
    """Tente de connecter un utilisateur."""
    users = st.session_state.users_db
    if email in users and users[email]["mot_de_passe"] == mot_de_passe:
        st.session_state.authenticated = True
        st.session_state.user = users[email]
        return True
    return False


def register(nom, email, mot_de_passe, type_compte):
    """Inscrit un nouvel utilisateur."""
    if email in st.session_state.users_db:
        return False, "Cet email est déjà utilisé."
    
    st.session_state.users_db[email] = {
        "nom": nom,
        "email": email,
        "mot_de_passe": mot_de_passe,
        "type_compte": type_compte,
    }
    st.session_state.authenticated = True
    st.session_state.user = st.session_state.users_db[email]
    return True, "Compte créé avec succès !"


def logout():
    """Déconnecte l'utilisateur."""
    st.session_state.authenticated = False
    st.session_state.user = None
    st.session_state.appareils = []
    st.session_state.formule_recommandee = None


def require_auth():
    """Vérifie si l'utilisateur est authentifié. Redirige sinon."""
    init_auth()
    if not st.session_state.authenticated:
        st.warning("🔒 Veuillez vous connecter pour accéder à cette page.")
        st.switch_page("app.py")
        st.stop()
    return st.session_state.user


def get_user():
    """Retourne l'utilisateur courant ou None."""
    return st.session_state.get("user", None)


def is_business():
    """Vérifie si l'utilisateur a un compte Business."""
    user = get_user()
    return user is not None and user.get("type_compte") == "Business"
