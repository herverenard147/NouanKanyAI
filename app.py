"""
EnergAI — Page d'accueil et authentification.
Point d'entrée de l'application avec connexion/inscription.
"""
import streamlit as st
import sys
import os

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from components.auth import init_auth, login, register, logout
from components.styles import inject_custom_css

# ── Configuration de la page ─────────────────────────────────────────────
st.set_page_config(
    page_title="EnergAI — Gestion intelligente d'énergie",
    page_icon="E",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Injecter le CSS custom
st.markdown(inject_custom_css(), unsafe_allow_html=True)

# Initialiser l'auth
init_auth()

# Cacher la sidebar complètement sur la page de connexion
st.markdown("""
<style>
    [data-testid="stSidebar"] { display: none !important; }
    [data-testid="collapsedControl"] { display: none !important; }
</style>
""", unsafe_allow_html=True)

# ── Si déjà connecté, rediriger vers le dashboard ────────────────────────
if st.session_state.authenticated:
    st.switch_page("pages/Tableau_de_Bord.py")

# ── Page de connexion ────────────────────────────────────────────────────
is_fr = st.session_state.langue == "FR"

if "auth_mode" not in st.session_state:
    st.session_state.auth_mode = "login"

# Layout Split Screen (Left: Hero, Right: Form)
col_hero, col_form = st.columns([1, 1], gap="large")

with col_hero:
    # Image générée
    st.image("assets/hero_illustration.png", use_container_width=True)
    
    st.markdown("""
    <div style="text-align: center; margin-top: 20px;">
        <h1 style="color: #0F7244; font-size: 32px; font-weight: 800; margin-bottom: 8px;">NouanKanyAI</h1>
        <h2 style="color: #1E293B; font-size: 20px; font-weight: 600;">
            """ + ("Reprenez le contrôle de votre facture CIE." if is_fr else "Take back control of your energy bill.") + """
        </h2>
    </div>
    """, unsafe_allow_html=True)

with col_form:
    st.markdown("<div style='padding-top: 20px;'></div>", unsafe_allow_html=True)
    
    if st.session_state.auth_mode == "login":
        st.markdown("<h3 style='text-align: center; color: #1E293B; margin-bottom: 24px;'>" + ("Bienvenue" if is_fr else "Welcome") + "</h3>", unsafe_allow_html=True)
        
        with st.form("login_form"):
            email = st.text_input(
                "Email",
                placeholder="demo@energai.ci",
            )
            password = st.text_input(
                "Mot de passe" if is_fr else "Password",
                type="password",
                placeholder="••••••••",
            )
            
            submitted = st.form_submit_button(
                "Se connecter" if is_fr else "Sign in",
                use_container_width=True,
            )
            
            if submitted:
                if login(email, password):
                    st.success("Connexion réussie !" if is_fr else "Login successful!")
                    st.rerun()
                else:
                    st.error("Email ou mot de passe incorrect" if is_fr else "Wrong email or password")
        
        st.markdown("")
        if st.button("Vous n'avez pas de compte ? S'inscrire" if is_fr else "Don't have an account? Register", use_container_width=True):
            st.session_state.auth_mode = "register"
            st.rerun()
            
        st.markdown(
            "<div style='text-align:center; color: #64748B; font-size:12px; margin-top: 16px;'>"
            + ("Comptes démo : demo@energai.ci / demo123 ou business@energai.ci / business123" 
               if is_fr else "Demo accounts: demo@energai.ci / demo123 or business@energai.ci / business123") +
            "</div>",
            unsafe_allow_html=True,
        )
    
    else:
        st.markdown("<h3 style='text-align: center; color: #1E293B; margin-bottom: 24px;'>" + ("Créer un compte" if is_fr else "Create an account") + "</h3>", unsafe_allow_html=True)
        
        with st.form("register_form"):
            reg_nom = st.text_input(
                "Nom complet" if is_fr else "Full name",
                placeholder="Kouamé Serge" if is_fr else "John Doe",
            )
            reg_email = st.text_input(
                "Email",
                placeholder="vous@email.com" if is_fr else "you@email.com",
            )
            reg_password = st.text_input(
                "Mot de passe" if is_fr else "Password",
                type="password",
                placeholder="••••••••",
            )
            
            type_compte = st.radio(
                "Type de compte" if is_fr else "Account type",
                ["Particulier", "Entreprise", "Industriel"],
                horizontal=True,
            )
            
            reg_submitted = st.form_submit_button(
                "Créer mon compte" if is_fr else "Create my account",
                use_container_width=True,
            )
            
            if reg_submitted:
                if not reg_nom or not reg_email or not reg_password:
                    st.error("Veuillez remplir tous les champs" if is_fr else "Please fill all fields")
                else:
                    success, msg = register(reg_nom, reg_email, reg_password, type_compte)
                    if success:
                        st.success(msg)
                        st.session_state.auth_mode = "login"
                        st.rerun()
                    else:
                        st.error(msg)
                        
        st.markdown("")
        if st.button("Déjà un compte ? Se connecter" if is_fr else "Already have an account? Log in", use_container_width=True):
            st.session_state.auth_mode = "login"
            st.rerun()

# ── Footer ───────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown(
    "<div style='text-align:center; color: #94A3B8; font-size:12px;'>"
    "© 2025 NouanKanyAI — Gestion intelligente d'énergie"
    "</div>",
    unsafe_allow_html=True,
)
