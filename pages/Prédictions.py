"""
EnergAI — Prédictions et Alertes.
Prédiction de consommation sur 30 jours avec seuils d'alerte configurables.
"""
import streamlit as st
import plotly.graph_objects as go
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from components.auth import init_auth, require_auth, logout
from components.styles import inject_custom_css, alert_item_html, metric_card_html
from components.prediction import predire_consommation_mois, detecter_anomalies
from data.synthetic_data import generer_historique_consommation, generer_alertes

# ── Config ────────────────────────────────────────────────────────────────
st.set_page_config(page_title="EnergAI — Prédictions", page_icon="E", layout="wide")
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
    st.markdown("---")
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

# ── Header ────────────────────────────────────────────────────────────────
st.markdown(f"# {'Prédictions & Alertes' if is_fr else 'Predictions & Alerts'}")
st.markdown(
    f"<span style='color: rgba(255,255,255,0.5);'>"
    f"{'Anticipez votre consommation et configurez vos alertes intelligentes' if is_fr else 'Anticipate your consumption and configure smart alerts'}"
    f"</span>",
    unsafe_allow_html=True,
)

# ── Données ──────────────────────────────────────────────────────────────
appareils = st.session_state.get("appareils", [])

# Générer les prédictions et l'historique
predictions = predire_consommation_mois(appareils, nb_jours=30)
historique = generer_historique_consommation(appareils, nb_jours=30)

# ── Configuration des seuils ──────────────────────────────────────────────
st.markdown(
    f"<div class='section-header'>{'Configuration des alertes' if is_fr else 'Alert configuration'}</div>",
    unsafe_allow_html=True,
)

col_seuil, col_info = st.columns([2, 1])

with col_seuil:
    seuil = st.slider(
        "Seuil d'alerte journalier (FCFA)" if is_fr else "Daily alert threshold (FCFA)",
        min_value=500,
        max_value=15000,
        value=st.session_state.get("seuil_alerte_fcfa", 3000),
        step=250,
        help="Vous recevrez une alerte si votre coût journalier dépasse ce seuil" if is_fr else "You'll receive an alert if your daily cost exceeds this threshold",
    )
    st.session_state.seuil_alerte_fcfa = seuil

with col_info:
    # Coût moyen journalier
    cout_moyen = round(historique["cout_fcfa"].mean(), 0) if not historique.empty else 0
    st.markdown(
        metric_card_html(
            "", f"{cout_moyen:,.0f} FCFA",
            "Coût moyen/jour" if is_fr else "Avg daily cost",
        ),
        unsafe_allow_html=True,
    )

# ── Graphique de prédiction 30 jours ──────────────────────────────────────
st.markdown(
    f"<div class='section-header'>{'Prédiction sur 30 jours' if is_fr else '30-day forecast'}</div>",
    unsafe_allow_html=True,
)

if not predictions.empty:
    fig = go.Figure()
    
    # Intervalle de confiance
    fig.add_trace(go.Scatter(
        x=predictions["date"],
        y=predictions["intervalle_haut"],
        mode='lines',
        line=dict(width=0),
        showlegend=False,
        hoverinfo='skip',
    ))
    fig.add_trace(go.Scatter(
        x=predictions["date"],
        y=predictions["intervalle_bas"],
        mode='lines',
        line=dict(width=0),
        fill='tonexty',
        fillcolor='rgba(0, 230, 118, 0.1)',
        name="Intervalle de confiance" if is_fr else "Confidence interval",
    ))
    
    # Courbe de prédiction
    fig.add_trace(go.Scatter(
        x=predictions["date"],
        y=predictions["prediction_kwh"],
        mode='lines+markers',
        name='Prédiction' if is_fr else 'Prediction',
        line=dict(color='#00E676', width=3),
        marker=dict(size=4),
    ))
    
    # Ligne de seuil
    seuil_kwh = seuil / 55  # Conversion approximative FCFA -> kWh
    fig.add_hline(
        y=seuil_kwh,
        line_dash="dash",
        line_color="#FF5252",
        annotation_text=f"{'Seuil' if is_fr else 'Threshold'}: {seuil:,.0f} FCFA",
        annotation_position="top left",
        annotation_font_color="#FF5252",
    )
    
    fig.update_layout(
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        font=dict(color='rgba(255,255,255,0.7)', family='Inter'),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(gridcolor='rgba(255,255,255,0.05)', showgrid=True),
        yaxis=dict(title="kWh", gridcolor='rgba(255,255,255,0.05)', showgrid=True),
        margin=dict(l=40, r=20, t=40, b=40),
        height=400,
        hovermode="x unified",
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Métriques de prédiction
    col1, col2, col3 = st.columns(3)
    
    cout_total_prevu = predictions["cout_prevu_fcfa"].sum()
    conso_totale_prevue = predictions["prediction_kwh"].sum()
    jours_alerte = len(predictions[predictions["cout_prevu_fcfa"] > seuil])
    
    with col1:
        st.markdown(
            metric_card_html("", f"{cout_total_prevu:,.0f} FCFA",
                           "Coût prévu ce mois" if is_fr else "Predicted monthly cost"),
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            metric_card_html("", f"{conso_totale_prevue:,.0f} kWh",
                           "Consommation prévue" if is_fr else "Predicted consumption"),
            unsafe_allow_html=True,
        )
    with col3:
        st.markdown(
            metric_card_html("", f"{jours_alerte} " + ("jours" if is_fr else "days"),
                           "Jours d'alerte prévus" if is_fr else "Expected alert days"),
            unsafe_allow_html=True,
        )

else:
    st.info("Ajoutez des appareils pour voir les prédictions." if is_fr else "Add devices to see predictions.")

# ── Détection d'anomalies ────────────────────────────────────────────────
st.markdown(
    f"<div class='section-header'>{'Anomalies détectées' if is_fr else 'Detected anomalies'}</div>",
    unsafe_allow_html=True,
)

if not historique.empty:
    anomalies = detecter_anomalies(historique)
    
    if anomalies:
        for anomalie in anomalies[:5]:
            st.markdown(
                f"""<div class="alert-item haute">
                    <div>
                        <div class="alert-type">{'Anomalie détectée' if is_fr else 'Anomaly detected'}</div>
                        <div class="alert-message">
                            {'Le' if is_fr else 'On'} {anomalie['date'].strftime('%d/%m/%Y')} : 
                            {anomalie['consommation_kwh']:.1f} kWh {'consommés vs' if is_fr else 'consumed vs'} 
                            {anomalie['prediction_kwh']:.1f} kWh {'prévus' if is_fr else 'predicted'} 
                            (+{anomalie['ecart_pct']:.0f}%)
                            <br>{'Economie potentielle' if is_fr else 'Potential saving'}: 
                            <strong style="color: #00E676;">{anomalie['economies_potentielles_fcfa']:,.0f} FCFA</strong>
                        </div>
                    </div>
                </div>""",
                unsafe_allow_html=True,
            )
    else:
        st.success("Aucune anomalie détectée — votre consommation est optimale !" if is_fr else "No anomalies detected — your consumption is optimal!")

# ── Historique des alertes ────────────────────────────────────────────────
st.markdown(
    f"<div class='section-header'>{'Historique des alertes' if is_fr else 'Alert history'}</div>",
    unsafe_allow_html=True,
)

alertes = generer_alertes(historique, seuil)
for alert in alertes:
    st.markdown(alert_item_html(alert), unsafe_allow_html=True)

# ── Notifications toast ──────────────────────────────────────────────────
nb_alertes_non_lues = len([a for a in alertes if not a.get("lu", False)])
if nb_alertes_non_lues > 0:
    st.toast(
        f"{nb_alertes_non_lues} " + ("nouvelles alertes" if is_fr else "new alerts"),
        icon="!",
    )
