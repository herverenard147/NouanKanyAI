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

# ── Sidebar ──────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## EnergAI")
    st.markdown("---")
    
    # Toggle langue
    col_lang1, col_lang2 = st.columns(2)
    with col_lang1:
        if st.button("FR", use_container_width=True, 
                     type="primary" if st.session_state.langue == "FR" else "secondary"):
            st.session_state.langue = "FR"
            st.rerun()
    with col_lang2:
        if st.button("EN", use_container_width=True,
                     type="primary" if st.session_state.langue == "EN" else "secondary"):
            st.session_state.langue = "EN"
            st.rerun()
    
    if st.session_state.authenticated:
        st.markdown(f"### {st.session_state.user['nom']}")
        st.markdown(f"*{st.session_state.user['type_compte']}*")
        st.markdown("---")
        if st.button("Se déconnecter", use_container_width=True):
            logout()
            st.rerun()

# ── Si déjà connecté, rediriger vers le dashboard ────────────────────────
if st.session_state.authenticated:
    st.switch_page("pages/Tableau_de_Bord.py")

# ── Page de connexion ────────────────────────────────────────────────────
is_fr = st.session_state.langue == "FR"

# Header centré
st.markdown("""
<div class="auth-header">
    <div class="auth-logo">EnergAI</div>
    <div class="auth-tagline">
        """ + ("Maîtrisez votre consommation d'énergie" if is_fr else "Master your energy consumption") + """
    </div>
</div>
""", unsafe_allow_html=True)

# Layout centré
col_spacer1, col_form, col_spacer2 = st.columns([1, 2, 1])

with col_form:
    # Tabs Connexion / Inscription
    tab_login, tab_register = st.tabs(
        ["Connexion" if is_fr else "Login", 
         "Inscription" if is_fr else "Register"]
    )
    
    # ── Tab Connexion ────────────────────────────────────────────
    with tab_login:
        st.markdown("")
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
        st.markdown(
            "<div style='text-align:center; color: rgba(255,255,255,0.4); font-size:13px;'>"
            + ("Comptes démo : demo@energai.ci / demo123 ou business@energai.ci / business123" 
               if is_fr else "Demo accounts: demo@energai.ci / demo123 or business@energai.ci / business123") +
            "</div>",
            unsafe_allow_html=True,
        )
    
    # ── Tab Inscription ──────────────────────────────────────────
    with tab_register:
        st.markdown("")
        with st.form("register_form"):
            reg_nom = st.text_input(
                "Nom complet" if is_fr else "Full name",
                placeholder="Kouamé Serge" if is_fr else "John Doe",
            )
            reg_email = st.text_input(
                "Email",
                placeholder="vous@email.com" if is_fr else "you@email.com",
                key="reg_email",
            )
            reg_password = st.text_input(
                "Mot de passe" if is_fr else "Password",
                type="password",
                placeholder="••••••••",
                key="reg_password",
            )
            
            # Choix du profil
            st.markdown("### " + ("Choisissez votre profil" if is_fr else "Choose your profile"))
            
            col_part, col_biz = st.columns(2)
            with col_part:
                st.markdown("""
                <div class="profile-card">
                    <div class="profile-icon">Particulier</div>
                    <div class="profile-title">""" + ("Particulier" if is_fr else "Individual") + """</div>
                    <div class="profile-desc">""" + ("Maison, appartement" if is_fr else "Home, apartment") + """</div>
                </div>
                """, unsafe_allow_html=True)
            
            with col_biz:
                st.markdown("""
                <div class="profile-card">
                    <div class="profile-icon">Business</div>
                    <div class="profile-title">Business</div>
                    <div class="profile-desc">""" + ("Entreprise, commerce" if is_fr else "Business, shop") + """</div>
                </div>
                """, unsafe_allow_html=True)
            
            type_compte = st.radio(
                "Type de compte" if is_fr else "Account type",
                ["Particulier", "Business"],
                horizontal=True,
                label_visibility="collapsed",
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
                        st.rerun()
                    else:
                        st.error(msg)

# ── Footer ───────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown(
    "<div style='text-align:center; color: rgba(255,255,255,0.3); font-size:12px;'>"
    "© 2025 EnergAI by NouanKany — Gestion intelligente d'énergie"
    "</div>",
    unsafe_allow_html=True,
)
