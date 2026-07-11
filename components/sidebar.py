import streamlit as st
from components.auth import logout

def render_sidebar():
    """Affiche la barre latérale personnalisée pour les utilisateurs connectés."""
    user = st.session_state.get("user")
    is_fr = st.session_state.get("langue", "FR") == "FR"

    with st.sidebar:
        st.markdown(
            """
            <div style="padding: 10px 0; margin-bottom: 20px;">
                <h1 style="color: #0F7244; font-size: 24px; font-weight: 800; margin: 0;">NouanKanyAI</h1>
            </div>
            """, 
            unsafe_allow_html=True
        )

        st.page_link("pages/Tableau_de_Bord.py", label="Tableau de Bord" if is_fr else "Dashboard", icon="📊")
        st.page_link("pages/Abonnement.py", label="Abonnement" if is_fr else "Billing", icon="💳")
        st.page_link("pages/Appareils.py", label="Appareils" if is_fr else "Devices", icon="🔌")
        st.page_link("pages/Prédictions.py", label="Prédictions" if is_fr else "Predictions", icon="📈")

        st.markdown("---")
        
        if user:
            st.markdown(f"**{user['nom']}**")
            st.markdown(f"<span style='color: #64748B; font-size: 13px;'>{user['type_compte']}</span>", unsafe_allow_html=True)
            
            abo = st.session_state.get("abonnement_actif", "decouverte")
            abo_noms = {"decouverte": "Découverte", "essentiel": "Essentiel", "optimum": "Optimum", "business": "Business"}
            st.markdown(f"<span style='color: #64748B; font-size: 13px;'>Formule: {abo_noms.get(abo, abo)}</span>", unsafe_allow_html=True)
            
            st.markdown("---")

        # Toggle langue
        col1, col2 = st.columns(2)
        with col1:
            if st.button("FR", use_container_width=True, type="primary" if is_fr else "secondary"):
                st.session_state.langue = "FR"
                st.rerun()
        with col2:
            if st.button("EN", use_container_width=True, type="primary" if not is_fr else "secondary"):
                st.session_state.langue = "EN"
                st.rerun()

        st.markdown("---")
        if st.button("Se déconnecter" if is_fr else "Logout", use_container_width=True):
            logout()
            st.switch_page("app.py")
