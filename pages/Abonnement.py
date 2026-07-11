"""
EnergAI — Formules d'Abonnement.
4 formules avec recommandation mise en évidence.
"""
import streamlit as st
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from components.auth import init_auth, require_auth, logout
from components.styles import inject_custom_css, subscription_card_html
from components.sidebar import render_sidebar

# ── Config ────────────────────────────────────────────────────────────────
st.set_page_config(page_title="EnergAI — Abonnement", page_icon="E", layout="wide")
st.markdown(inject_custom_css(), unsafe_allow_html=True)

init_auth()
user = require_auth()
is_fr = st.session_state.get("langue", "FR") == "FR"

# ── Sidebar ──────────────────────────────────────────────────────────────
render_sidebar()

# ── Header ────────────────────────────────────────────────────────────────
formules_title = "Formules d'Abonnement" if is_fr else "Subscription Plans"
st.markdown(f"# {formules_title}")
st.markdown(
    f"<span style='color: rgba(255,255,255,0.5);'>"
    f"{'Choisissez la formule adaptée à vos besoins énergétiques' if is_fr else 'Choose the plan that fits your energy needs'}"
    f"</span>",
    unsafe_allow_html=True,
)

# ── Charger les tarifs ────────────────────────────────────────────────────
tariffs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "cie_tariffs.json")
try:
    with open(tariffs_path, "r", encoding="utf-8") as f:
        tariffs = json.load(f)
    formules = tariffs["formules_abonnement"]
except Exception:
    formules = [
        {"id": "decouverte", "nom": "Découverte", "prix_mensuel_fcfa": 0, "cible": "Particulier",
         "fonctionnalites": ["Suivi basique", "3 appareils max", "Rapport mensuel"]},
        {"id": "essentiel", "nom": "Essentiel", "prix_mensuel_fcfa": 2900, "cible": "Particulier",
         "fonctionnalites": ["Suivi détaillé", "10 appareils", "Prédictions", "Alertes"]},
        {"id": "optimum", "nom": "Optimum", "prix_mensuel_fcfa": 7900, "cible": "Particulier/Business",
         "fonctionnalites": ["Temps réel", "Illimité", "Analyse avancée", "Assistant"]},
        {"id": "business", "nom": "Business", "prix_mensuel_fcfa": 19900, "cible": "Business",
         "fonctionnalites": ["Tout Optimum", "Multi-sites", "Support 24/7", "API"]},
    ]

# Recommandation
reco = st.session_state.get("formule_recommandee", None)
reco_id = reco["formule_id"] if reco else None

# Abonnement actif
abo_actif = st.session_state.get("abonnement_actif", "decouverte")

# ── Affichage de la recommandation ─────────────────────────────────────────
if reco:
    st.markdown(
        f"""<div class="glass-card" style="border-color: #0F7244; background: #F0FDF4; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <span style="font-size: 36px;"></span>
                <div>
                    <div style="font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: #0F7244;">
                        {'Recommandation basée sur vos appareils' if is_fr else 'Recommendation based on your devices'}
                    </div>
                    <div style="font-size: 14px; color: #64748B; margin-top: 4px;">
                        {reco['raison'][:150]}...
                    </div>
                </div>
            </div>
        </div>""",
        unsafe_allow_html=True,
    )

# ── Cartes d'abonnement ──────────────────────────────────────────────────
st.markdown(
    f"<div class='section-header'>{'Nos formules' if is_fr else 'Our plans'}</div>",
    unsafe_allow_html=True,
)

col1, col2, col3, col4 = st.columns(4)
columns = [col1, col2, col3, col4]

for i, formule in enumerate(formules):
    with columns[i]:
        is_recommended = formule["id"] == reco_id
        is_active = formule["id"] == abo_actif
        
        st.markdown(
            subscription_card_html(
                name=formule["nom"],
                price=formule["prix_mensuel_fcfa"],
                features=formule["fonctionnalites"],
                recommended=is_recommended,
                cible=formule.get("cible", ""),
            ),
            unsafe_allow_html=True,
        )
        
        # Bouton de souscription
        if is_active:
            st.success("Formule active" if is_fr else "Active plan")
        else:
            label = ("Recommandé — Souscrire" if is_fr else "Recommended — Subscribe") if is_recommended \
                else ("Souscrire" if is_fr else "Subscribe")
            if st.button(
                label,
                key=f"sub_{formule['id']}",
                use_container_width=True,
                type="primary" if is_recommended else "secondary",
            ):
                st.session_state.abonnement_actif = formule["id"]
                st.success(f"Formule {formule['nom']} activée !" if is_fr else f"{formule['nom']} plan activated!")
                st.rerun()

# ── Tableau comparatif ───────────────────────────────────────────────────
st.markdown(
    f"<div class='section-header'>{'Comparaison détaillée' if is_fr else 'Detailed comparison'}</div>",
    unsafe_allow_html=True,
)

# Tableau de comparaison
fonctionnalites_all = [
    ("Suivi de consommation" if is_fr else "Consumption tracking", "✅", "✅", "✅", "✅"),
    ("Nombre d'appareils" if is_fr else "Number of devices", "3", "10", "∞", "∞"),
    ("Prédictions mensuelles" if is_fr else "Monthly predictions", "❌", "✅", "✅", "✅"),
    ("Alertes de seuil" if is_fr else "Threshold alerts", "❌", "✅", "✅", "✅"),
    ("Assistant prescriptif" if is_fr else "Prescriptive assistant", "❌", "❌", "✅", "✅"),
    ("Détection d'anomalies" if is_fr else "Anomaly detection", "❌", "❌", "✅", "✅"),
    ("Rapports personnalisés" if is_fr else "Custom reports", "Mensuel" if is_fr else "Monthly", "Hebdo" if is_fr else "Weekly", "Quotidien" if is_fr else "Daily", "Quotidien" if is_fr else "Daily"),
    ("Multi-sites" if is_fr else "Multi-site", "❌", "❌", "❌", "✅"),
    ("Support prioritaire" if is_fr else "Priority support", "❌", "❌", "❌", "24/7"),
    ("API d'intégration" if is_fr else "Integration API", "❌", "❌", "❌", "✅"),
    ("Audit énergétique" if is_fr else "Energy audit", "❌", "❌", "❌", "✅"),
]

import pandas as pd
df_compare = pd.DataFrame(
    fonctionnalites_all,
    columns=[
        "Fonctionnalité" if is_fr else "Feature",
        "Découverte", "Essentiel", "Optimum", "Business",
    ],
)

st.dataframe(
    df_compare,
    use_container_width=True,
    hide_index=True,
    height=440,
)

# ── Grille tarifaire CIE ─────────────────────────────────────────────────
st.markdown(
    f"<div class='section-header'>{'Grille tarifaire CIE — Référence' if is_fr else 'CIE Tariff Grid — Reference'}</div>",
    unsafe_allow_html=True,
)

try:
    tranches = tariffs["tranches"]
    df_tranches = pd.DataFrame([
        {
            "Tranche" if is_fr else "Tier": t["nom"],
            "Plage (kWh)" if is_fr else "Range (kWh)": f"{t['min_kwh']} — {t['max_kwh']}",
            "Prix/kWh (FCFA)" if is_fr else "Price/kWh (FCFA)": f"{t['prix_kwh_fcfa']:.2f}",
            "Prime fixe (FCFA)" if is_fr else "Fixed fee (FCFA)": f"{t['prime_fixe_fcfa']:,.0f}",
        }
        for t in tranches
    ])
    st.dataframe(df_tranches, use_container_width=True, hide_index=True)
except Exception:
    st.info("Grille tarifaire CIE non disponible" if is_fr else "CIE tariff grid unavailable")

# ── Footer ────────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown(
    "<div style='text-align:center; color: #94A3B8; font-size:12px;'>"
    "EnergAI — Tarifs basés sur le référentiel CIE Côte d'Ivoire | "
    "L'assistant utilise strictement le référentiel tarifaire structuré"
    "</div>",
    unsafe_allow_html=True,
)
