"""
EnergAI — Déclaration d'Appareils.
Formulaire répétable pour ajouter des appareils avec auto-estimation de puissance.
"""
import streamlit as st
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from components.auth import init_auth, require_auth, logout
from components.styles import inject_custom_css, metric_card_html
from components.sidebar import render_sidebar
from components.recommendation import recommander_formule, calculer_economies_estimees
from data.synthetic_data import get_categories, get_appareils_par_categorie

# ── Config ────────────────────────────────────────────────────────────────
st.set_page_config(page_title="EnergAI — Appareils", page_icon="E", layout="wide")
st.markdown(inject_custom_css(), unsafe_allow_html=True)

init_auth()
user = require_auth()
is_fr = st.session_state.get("langue", "FR") == "FR"

# ── Sidebar ──────────────────────────────────────────────────────────────
render_sidebar()

# ── Header ────────────────────────────────────────────────────────────────
st.markdown(f"# {'Mes Appareils' if is_fr else 'My Devices'}")
st.markdown(
    f"<span style='color: rgba(255,255,255,0.5);'>"
    f"{'Déclarez vos appareils électriques pour des prédictions personnalisées' if is_fr else 'Declare your electrical devices for personalized predictions'}"
    f"</span>",
    unsafe_allow_html=True,
)

# ── Formulaire d'ajout ───────────────────────────────────────────────────
st.markdown(
    f"<div class='section-header'>{'Ajouter un appareil' if is_fr else 'Add a device'}</div>",
    unsafe_allow_html=True,
)

with st.form("add_device_form"):
    col1, col2 = st.columns(2)
    
    with col1:
        # Catégorie
        categories = get_categories()
        # Filtrer Business si pas Business
        if user["type_compte"] != "Business":
            categories = [c for c in categories if c != "Business / Industriel"]
        
        categorie = st.selectbox(
            "Catégorie" if is_fr else "Category",
            categories,
        )
    
    with col2:
        # Appareil selon catégorie
        appareils_cat = get_appareils_par_categorie(categorie)
        noms_appareils = [a["nom"] for a in appareils_cat]
        appareil_choisi = st.selectbox(
            "Appareil" if is_fr else "Device",
            noms_appareils,
        )
    
    col3, col4, col5 = st.columns(3)
    
    with col3:
        # Auto-remplir la puissance
        puissance_defaut = next(
            (a["puissance_kw"] for a in appareils_cat if a["nom"] == appareil_choisi),
            0.1,
        )
        puissance = st.number_input(
            "Puissance (kW)" if is_fr else "Power (kW)",
            min_value=0.01,
            max_value=50.0,
            value=puissance_defaut,
            step=0.05,
            help="Auto-estimé selon l'appareil sélectionné" if is_fr else "Auto-estimated based on selected device",
        )
    
    with col4:
        quantite = st.number_input(
            "Quantité" if is_fr else "Quantity",
            min_value=1,
            max_value=50,
            value=1,
        )
    
    with col5:
        heures = st.number_input(
            "Heures/jour" if is_fr else "Hours/day",
            min_value=0.5,
            max_value=24.0,
            value=6.0,
            step=0.5,
        )
    
    submitted = st.form_submit_button(
        "Ajouter l'appareil" if is_fr else "Add device",
        use_container_width=True,
    )
    
    if submitted:
        icone = next(
            (a["icone"] for a in appareils_cat if a["nom"] == appareil_choisi),
            "",
        )
        nouvel_appareil = {
            "nom": appareil_choisi,
            "categorie": categorie,
            "puissance_kw": puissance,
            "quantite": quantite,
            "heures_jour": heures,
            "icone": icone,
        }
        st.session_state.appareils.append(nouvel_appareil)
        st.success(f"{appareil_choisi} " + ("ajouté !" if is_fr else "added!"))
        st.rerun()

# ── Liste des appareils déclarés ──────────────────────────────────────────
appareils = st.session_state.get("appareils", [])

st.markdown(
    f"<div class='section-header'>{'Appareils déclarés' if is_fr else 'Declared devices'} ({len(appareils)})</div>",
    unsafe_allow_html=True,
)

if appareils:
    # Résumé en métriques
    nb_total = sum(a["quantite"] for a in appareils)
    puissance_totale = sum(a["puissance_kw"] * a["quantite"] for a in appareils)
    conso_jour = sum(a["puissance_kw"] * a["quantite"] * a["heures_jour"] for a in appareils)
    cout_jour = conso_jour * 55  # Tarif moyen
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(
            metric_card_html("", str(nb_total), "Appareils" if is_fr else "Devices"),
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            metric_card_html("", f"{puissance_totale:.1f} kW", "Puissance totale" if is_fr else "Total power"),
            unsafe_allow_html=True,
        )
    with col3:
        st.markdown(
            metric_card_html("", f"{conso_jour:.1f} kWh", "Consommation/jour" if is_fr else "Daily consumption"),
            unsafe_allow_html=True,
        )
    with col4:
        st.markdown(
            metric_card_html("", f"{cout_jour:,.0f} FCFA", "Coût estimé/jour" if is_fr else "Estimated daily cost"),
            unsafe_allow_html=True,
        )
    
    st.markdown("")
    
    # Liste détaillée
    for i, a in enumerate(appareils):
        col_info, col_del = st.columns([5, 1])
        with col_info:
            conso = a["puissance_kw"] * a["quantite"] * a["heures_jour"]
            st.markdown(
                f"""<div class="glass-card" style="padding: 14px 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 24px; margin-right: 12px;">{a.get('icone', '')}</span>
                            <strong style="font-size: 16px; color: #1E293B;">{a['nom']}</strong>
                            <span style="color: #64748B; margin-left: 8px;">× {a['quantite']}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #0F7244; font-weight: 700;">{conso:.1f} kWh/jour</div>
                            <div style="color: #94A3B8; font-size: 12px;">{a['puissance_kw']} kW · {a['heures_jour']}h/jour</div>
                        </div>
                    </div>
                </div>""",
                unsafe_allow_html=True,
            )
        with col_del:
            if st.button("X", key=f"del_{i}", help="Supprimer" if is_fr else "Delete"):
                st.session_state.appareils.pop(i)
                st.rerun()
    
    # ── Recommandation automatique ────────────────────────────────
    st.markdown(
        f"<div class='section-header'>{'Recommandation' if is_fr else 'Recommendation'}</div>",
        unsafe_allow_html=True,
    )
    
    reco = recommander_formule(appareils, user["type_compte"])
    st.session_state.formule_recommandee = reco
    
    economies = calculer_economies_estimees(appareils, reco["formule_id"])
    
    col_reco, col_eco = st.columns([2, 1])
    
    with col_reco:
        st.markdown(
            f"""<div class="glass-card" style="border-color: #0F7244; background: #F0FDF4;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <span style="font-size: 32px;"></span>
                    <div>
                        <div style="font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; color: #0F7244;">
                            {'Formule' if is_fr else 'Plan'} {reco['formule_nom']} {'recommandée' if is_fr else 'recommended'}
                        </div>
                        <div style="font-size: 13px; color: #64748B;">
                            {'Confiance' if is_fr else 'Confidence'}: {reco['score_confiance']}%
                        </div>
                    </div>
                </div>
                <div style="font-size: 14px; color: #475569; line-height: 1.6;">
                    {reco['raison']}
                </div>
            </div>""",
            unsafe_allow_html=True,
        )
    
    with col_eco:
        st.markdown(
            f"""<div class="glass-card" style="text-align: center; border-color: #E2E8F0;">
                <div style="font-size: 28px; margin-bottom: 8px;"></div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #0F7244;">
                    {economies['economies_fcfa']:,.0f} FCFA
                </div>
                <div style="font-size: 13px; color: #64748B;">
                    {'économies estimées/mois' if is_fr else 'estimated savings/month'}
                </div>
                <div style="font-size: 14px; color: #0EA5E9; margin-top: 8px;">
                    -{economies['pct_economies']}% {'sur votre facture' if is_fr else 'on your bill'}
                </div>
            </div>""",
            unsafe_allow_html=True,
        )
    
    # Bouton pour souscrire
    if st.button(
        "Souscrire à la formule " + reco['formule_nom'] if is_fr else "Subscribe to " + reco['formule_nom'] + " plan",
        use_container_width=True,
    ):
        st.session_state.abonnement_actif = reco["formule_id"]
        st.success(f"Formule {reco['formule_nom']} activée !" if is_fr else f"{reco['formule_nom']} plan activated!")

else:
    st.markdown(
        f"""<div class="glass-card" style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 16px;"></div>
            <div style="font-size: 18px; color: #1E293B; font-weight: 600;">
                {'Aucun appareil déclaré' if is_fr else 'No devices declared'}
            </div>
            <div style="color: #64748B; margin-top: 8px;">
                {'Ajoutez vos appareils ci-dessus pour obtenir des prédictions personnalisées' if is_fr else 'Add your devices above for personalized predictions'}
            </div>
        </div>""",
        unsafe_allow_html=True,
    )
