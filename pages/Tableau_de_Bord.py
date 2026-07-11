"""
EnergAI — Tableau de Bord Principal.
Écran le plus important avec le compteur de gains FCFA animé.
"""
import streamlit as st
import plotly.graph_objects as go
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from components.auth import init_auth, require_auth, logout
from components.styles import (
    inject_custom_css, savings_counter_html, metric_card_html,
    alert_item_html, progress_bar_html,
)
from components.prediction import (
    calculer_economies_totales, calculer_score_efficacite,
)
from data.synthetic_data import generer_historique_consommation, generer_alertes

# ── Config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="EnergAI — Tableau de Bord",
    page_icon="E",
    layout="wide",
)
st.markdown(inject_custom_css(), unsafe_allow_html=True)

init_auth()
user = require_auth()
is_fr = st.session_state.get("langue", "FR") == "FR"

# ── Sidebar ──────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## EnergAI")
    st.markdown("---")
    st.markdown(f"### {user['nom']}")
    st.markdown(f"*{user['type_compte']}*")
    
    # Abonnement actif
    abo = st.session_state.get("abonnement_actif", "decouverte")
    abo_noms = {"decouverte": "Découverte", "essentiel": "Essentiel", "optimum": "Optimum", "business": "Business"}
    st.markdown(f"**Formule**: {abo_noms.get(abo, abo)}")
    
    st.markdown("---")
    
    # Toggle langue
    col1, col2 = st.columns(2)
    with col1:
        if st.button("FR", use_container_width=True,
                     type="primary" if is_fr else "secondary"):
            st.session_state.langue = "FR"
            st.rerun()
    with col2:
        if st.button("EN", use_container_width=True,
                     type="primary" if not is_fr else "secondary"):
            st.session_state.langue = "EN"
            st.rerun()
    
    st.markdown("---")
    if st.button("Se déconnecter" if is_fr else "Logout", use_container_width=True):
        logout()
        st.switch_page("app.py")

# ── Générer les données ──────────────────────────────────────────────────
appareils = st.session_state.get("appareils", [])
historique = generer_historique_consommation(appareils, nb_jours=30)
economies = calculer_economies_totales(historique)
score = calculer_score_efficacite(appareils, historique)
alertes = generer_alertes(historique, st.session_state.get("seuil_alerte_fcfa", 3000))

# Stocker les alertes
st.session_state.alertes = alertes

# ── Header ────────────────────────────────────────────────────────────────
col_title, col_notif = st.columns([4, 1])
with col_title:
    st.markdown(
        f"# {'Tableau de Bord' if is_fr else 'Dashboard'}"
    )
    st.markdown(
        f"<span style='color: rgba(255,255,255,0.5);'>"
        f"{'Bienvenue' if is_fr else 'Welcome'}, **{user['nom']}**</span>",
        unsafe_allow_html=True,
    )
with col_notif:
    nb_alertes = len([a for a in alertes if not a.get("lu", False)])
    st.markdown(
        f"<div style='text-align:right; margin-top:20px;'>"
        f"Notifications <span class='notif-badge'>{nb_alertes}</span>"
        f"</div>",
        unsafe_allow_html=True,
    )

# ══════════════════════════════════════════════════════════════════════════
# 🔥 SECTION HÉROS — COMPTEUR DE GAINS FCFA (LE PLUS IMPORTANT)
# ══════════════════════════════════════════════════════════════════════════
st.markdown(
    savings_counter_html(
        amount=economies["economies_fcfa"],
        trend_pct=economies["pct"],
        alerts_count=economies["alertes"],
        kwh_saved=economies["kwh_economises"],
    ),
    unsafe_allow_html=True,
)

# ── Grille de Métriques ──────────────────────────────────────────────────
st.markdown(
    f"<div class='section-header'>{'Métriques clés' if is_fr else 'Key Metrics'}</div>",
    unsafe_allow_html=True,
)

col1, col2, col3, col4 = st.columns(4)

# Consommation actuelle
conso_actuelle = round(historique["consommation_kwh"].iloc[-1], 1) if not historique.empty else 0
with col1:
    st.markdown(
        metric_card_html(
            "", f"{conso_actuelle} kW",
            "Consommation actuelle" if is_fr else "Current consumption",
            delta="-8%" if is_fr else "-8%",
            delta_type="positive",
        ),
        unsafe_allow_html=True,
    )

# Prévision du mois
prev_mois = round(historique["prediction_kwh"].sum(), 0) if not historique.empty else 0
with col2:
    st.markdown(
        metric_card_html(
            "", f"{prev_mois:,.0f} kWh",
            "Prévision du mois" if is_fr else "Monthly forecast",
            delta="↘ -5%",
            delta_type="positive",
        ),
        unsafe_allow_html=True,
    )

# Coût estimé
cout_estime = round(historique["cout_fcfa"].sum(), 0) if not historique.empty else 0
with col3:
    st.markdown(
        metric_card_html(
            "", f"{cout_estime:,.0f} FCFA",
            "Coût estimé" if is_fr else "Estimated cost",
            delta="-12 300 FCFA" if is_fr else "-12,300 FCFA",
            delta_type="positive",
        ),
        unsafe_allow_html=True,
    )

# Score d'efficacité
with col4:
    color = "green" if score >= 70 else "orange" if score >= 50 else "red"
    st.markdown(
        metric_card_html(
            "", f"{score}/100",
            "Score d'efficacité" if is_fr else "Efficiency score",
            delta="+" + str(max(3, score - 65)) + " pts",
            delta_type="positive" if score >= 65 else "negative",
        ),
        unsafe_allow_html=True,
    )

# ── Graphique Principal ──────────────────────────────────────────────────
st.markdown(
    f"<div class='section-header'>{'Consommation vs Prédiction — 30 derniers jours' if is_fr else 'Consumption vs Prediction — Last 30 days'}</div>",
    unsafe_allow_html=True,
)

if not historique.empty:
    fig = go.Figure()
    
    # Zone de confiance (±15%)
    fig.add_trace(go.Scatter(
        x=historique["date"],
        y=historique["prediction_kwh"] * 1.15,
        mode='lines',
        line=dict(width=0),
        showlegend=False,
        hoverinfo='skip',
    ))
    fig.add_trace(go.Scatter(
        x=historique["date"],
        y=historique["prediction_kwh"] * 0.85,
        mode='lines',
        line=dict(width=0),
        fill='tonexty',
        fillcolor='rgba(0, 176, 255, 0.08)',
        showlegend=False,
        hoverinfo='skip',
    ))
    
    # Courbe prédiction
    fig.add_trace(go.Scatter(
        x=historique["date"],
        y=historique["prediction_kwh"],
        mode='lines',
        name='Prédiction' if is_fr else 'Prediction',
        line=dict(color='#00B0FF', width=2, dash='dash'),
    ))
    
    # Courbe consommation réelle
    fig.add_trace(go.Scatter(
        x=historique["date"],
        y=historique["consommation_kwh"],
        mode='lines+markers',
        name='Consommation réelle' if is_fr else 'Actual consumption',
        line=dict(color='#00E676', width=3),
        marker=dict(size=4),
    ))
    
    # Zones de surconsommation (rouge)
    seuil = historique["prediction_kwh"] * 1.25
    surconso_mask = historique["consommation_kwh"] > seuil
    if surconso_mask.any():
        fig.add_trace(go.Scatter(
            x=historique.loc[surconso_mask, "date"],
            y=historique.loc[surconso_mask, "consommation_kwh"],
            mode='markers',
            name='Surconsommation' if is_fr else 'Overconsumption',
            marker=dict(color='#FF5252', size=10, symbol='diamond'),
        ))
    
    fig.update_layout(
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        font=dict(color='rgba(255,255,255,0.7)', family='Inter'),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            font=dict(size=12),
        ),
        xaxis=dict(
            gridcolor='rgba(255,255,255,0.05)',
            showgrid=True,
        ),
        yaxis=dict(
            title="kWh",
            gridcolor='rgba(255,255,255,0.05)',
            showgrid=True,
        ),
        margin=dict(l=40, r=20, t=40, b=40),
        height=380,
        hovermode="x unified",
    )
    
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info("Ajoutez des appareils pour voir vos données de consommation." if is_fr else "Add devices to see your consumption data.")

# ── Section Bas : Appareils + Alertes ────────────────────────────────────
col_left, col_right = st.columns([1, 1])

# Appareils les plus énergivores
with col_left:
    st.markdown(
        f"<div class='section-header'>{'Appareils les plus énergivores' if is_fr else 'Most energy-consuming devices'}</div>",
        unsafe_allow_html=True,
    )
    
    if appareils:
        # Calculer la consommation par appareil
        conso_par_appareil = []
        for a in appareils:
            conso = a.get("puissance_kw", 0) * a.get("quantite", 1) * a.get("heures_jour", 6)
            conso_par_appareil.append({"nom": a["nom"], "conso": conso})
        
        conso_par_appareil.sort(key=lambda x: x["conso"], reverse=True)
        total_conso = sum(c["conso"] for c in conso_par_appareil)
        
        colors = ["green", "blue", "orange", "red"]
        for i, c in enumerate(conso_par_appareil[:5]):
            pct = (c["conso"] / total_conso * 100) if total_conso > 0 else 0
            color = colors[min(i, len(colors) - 1)]
            st.markdown(
                progress_bar_html(
                    f"{c['nom']}",
                    pct, 100, color,
                ),
                unsafe_allow_html=True,
            )
    else:
        # Données par défaut pour la démo
        default_appareils = [
            ("Climatiseur", 45, "red"),
            ("Réfrigérateur", 20, "orange"),
            ("Chauffe-eau", 15, "blue"),
            ("Téléviseur", 10, "green"),
            ("Éclairage", 10, "green"),
        ]
        for nom, pct, color in default_appareils:
            st.markdown(progress_bar_html(nom, pct, 100, color), unsafe_allow_html=True)

# Alertes récentes
with col_right:
    st.markdown(
        f"<div class='section-header'>{'Alertes récentes' if is_fr else 'Recent Alerts'} "
        f"<span class='notif-badge'>{len(alertes)}</span></div>",
        unsafe_allow_html=True,
    )
    
    for alert in alertes[:5]:
        st.markdown(alert_item_html(alert), unsafe_allow_html=True)

# ── Footer ────────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown(
    "<div style='text-align:center; color: rgba(255,255,255,0.3); font-size:12px;'>"
    "EnergAI — Gestion intelligente d'énergie | Données mises à jour en temps réel"
    "</div>",
    unsafe_allow_html=True,
)
