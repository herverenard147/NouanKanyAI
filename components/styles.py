"""
EnergAI — CSS Light Theme Corporate et styles injectés pour Streamlit.
Design flat, épuré avec des accents verts.
"""

def inject_custom_css():
    """Retourne le CSS custom à injecter via st.markdown."""
    return """
    <style>
    /* ══════════════════════════════════════════════════════════════
       ENERGAI — LIGHT CORPORATE THEME
       ══════════════════════════════════════════════════════════════ */
    
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap');

    /* ── Global ────────────────────────────────────────────────── */
    .stApp {
        background-color: #F8FAFC !important;
        font-family: 'Inter', sans-serif;
        color: #1E293B;
    }

    .stApp > header {
        background-color: transparent !important;
    }

    /* ── Sidebar ───────────────────────────────────────────────── */
    [data-testid="stSidebar"] {
        background-color: #FFFFFF !important;
        border-right: 1px solid #E2E8F0;
    }
    
    [data-testid="stSidebar"] .stMarkdown h1,
    [data-testid="stSidebar"] .stMarkdown h2,
    [data-testid="stSidebar"] .stMarkdown h3,
    [data-testid="stSidebar"] p {
        color: #1E293B !important;
    }
    
    [data-testid="stSidebar"] hr {
        border-color: #E2E8F0 !important;
    }

    /* ── Cards (Flat Corporate) ────────────────────────────────── */
    .glass-card, .metric-card, .sub-card, .mini-stat {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        padding: 24px;
        margin: 8px 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
    }
    
    .glass-card:hover, .metric-card:hover, .sub-card:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        border-color: #0F7244;
        transform: translateY(-2px);
    }

    /* ── Hero Savings Counter (Login Left Panel Style) ─────────── */
    .savings-hero {
        background-color: #E6F4EA;
        border: 1px solid rgba(15, 114, 68, 0.2);
        border-radius: 16px;
        padding: 40px;
        margin: 16px 0 24px 0;
        text-align: center;
    }

    .savings-label {
        font-family: 'Inter', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #0F7244;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
    }

    .savings-amount {
        font-family: 'Outfit', sans-serif;
        font-size: 56px;
        font-weight: 800;
        color: #0F7244;
        line-height: 1.1;
        margin: 8px 0;
    }

    .savings-trend {
        font-size: 16px;
        font-weight: 600;
        color: #047857;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    /* ── Metric Cards ──────────────────────────────────────────── */
    .metric-card {
        padding: 20px;
        text-align: left;
    }

    .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .metric-label {
        font-size: 13px;
        font-weight: 600;
        color: #64748B;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .metric-value {
        font-family: 'Outfit', sans-serif;
        font-size: 32px;
        font-weight: 700;
        color: #1E293B;
        margin: 0;
    }

    .metric-delta {
        font-size: 14px;
        font-weight: 600;
        margin-top: 8px;
        display: inline-flex;
        padding: 2px 8px;
        border-radius: 12px;
    }

    .metric-delta.positive { 
        color: #047857;
        background-color: #ECFDF5;
    }
    .metric-delta.negative { 
        color: #B91C1C;
        background-color: #FEF2F2;
    }

    /* ── Alert Cards ───────────────────────────────────────────── */
    .alert-item {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-left: 4px solid;
        border-radius: 8px;
        padding: 16px;
        margin: 8px 0;
        box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }

    .alert-item.haute { border-left-color: #DC2626; }
    .alert-item.moyenne { border-left-color: #F59E0B; }
    .alert-item.info { border-left-color: #0F7244; }

    .alert-type {
        font-weight: 700;
        font-size: 14px;
        color: #1E293B;
        margin-bottom: 4px;
    }

    .alert-message {
        font-size: 13px;
        color: #475569;
        line-height: 1.5;
    }

    .alert-date {
        font-size: 11px;
        color: #94A3B8;
        margin-top: 8px;
    }

    /* ── Progress Bars ─────────────────────────────────────────── */
    .progress-container {
        margin: 12px 0;
    }

    .progress-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #334155;
    }

    .progress-bar {
        height: 6px;
        background: #E2E8F0;
        border-radius: 3px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        border-radius: 3px;
        background-color: #0F7244;
    }

    .progress-fill.red { background-color: #DC2626; }
    .progress-fill.orange { background-color: #F59E0B; }
    .progress-fill.blue { background-color: #0EA5E9; }

    /* ── Auth Page ──────────────────────────────────────────────── */
    .auth-container {
        max-width: 480px;
        margin: 0 auto;
        padding: 40px;
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        border: 1px solid #E2E8F0;
    }

    .auth-header {
        text-align: center;
        margin-bottom: 32px;
    }

    .auth-logo {
        font-family: 'Outfit', sans-serif;
        font-size: 36px;
        font-weight: 800;
        color: #0F7244;
        margin-bottom: 8px;
    }

    .auth-tagline {
        font-size: 16px;
        color: #64748B;
        line-height: 1.5;
    }

    .profile-card {
        background: #F8FAFC;
        border: 2px solid #E2E8F0;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .profile-card:hover {
        border-color: #0F7244;
        background: #F0FDF4;
    }

    .profile-icon {
        font-size: 32px;
        color: #0F7244;
        margin-bottom: 8px;
    }

    .profile-title {
        font-family: 'Inter', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #1E293B;
    }

    .profile-desc {
        font-size: 12px;
        color: #64748B;
    }

    /* ── Subscription Cards ────────────────────────────────────── */
    .sub-card {
        text-align: center;
        position: relative;
    }

    .sub-card.recommended {
        border-color: #0F7244;
        background: #F0FDF4;
        box-shadow: 0 4px 6px -1px rgba(15, 114, 68, 0.1);
    }

    .sub-badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: #0F7244;
        color: #FFFFFF;
        font-weight: 600;
        font-size: 11px;
        padding: 4px 12px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .sub-name {
        font-family: 'Outfit', sans-serif;
        font-size: 20px;
        font-weight: 700;
        color: #1E293B;
        margin: 12px 0 4px;
    }

    .sub-price {
        font-family: 'Outfit', sans-serif;
        font-size: 32px;
        font-weight: 800;
        color: #0F7244;
    }

    .sub-period {
        font-size: 13px;
        color: #64748B;
    }

    .sub-features {
        text-align: left;
        margin: 20px 0;
        padding: 0;
        list-style: none;
    }

    .sub-features li {
        padding: 8px 0;
        font-size: 14px;
        color: #334155;
        border-bottom: 1px solid #F1F5F9;
    }
    
    .sub-features li:last-child {
        border-bottom: none;
    }

    .sub-features li::before {
        content: '✓ ';
        color: #0F7244;
        font-weight: 700;
    }

    /* ── Section Headers ───────────────────────────────────────── */
    .section-header {
        font-family: 'Outfit', sans-serif;
        font-size: 20px;
        font-weight: 700;
        color: #1E293B;
        margin: 24px 0 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #E2E8F0;
    }

    /* ── Notification Badge ────────────────────────────────────── */
    .notif-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #DC2626;
        color: white;
        font-size: 11px;
        font-weight: 700;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        padding: 0 6px;
    }

    /* ── Streamlit Overrides ───────────────────────────────────── */
    .stButton > button {
        background-color: #0F7244 !important;
        color: #FFFFFF !important;
        font-weight: 600 !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 8px 24px !important;
        transition: all 0.2s ease !important;
    }

    .stButton > button:hover {
        background-color: #0B5532 !important;
    }
    
    /* Secondary button styling (Streamlit default secondary) */
    .stButton > button[kind="secondary"] {
        background-color: #FFFFFF !important;
        color: #1E293B !important;
        border: 1px solid #E2E8F0 !important;
    }
    
    .stButton > button[kind="secondary"]:hover {
        background-color: #F8FAFC !important;
        border-color: #CBD5E1 !important;
    }

    .stSelectbox > div > div,
    .stTextInput > div > div > input,
    .stNumberInput > div > div > input {
        background-color: #FFFFFF !important;
        border: 1px solid #CBD5E1 !important;
        border-radius: 8px !important;
        color: #1E293B !important;
    }

    .stSelectbox > div > div:focus-within,
    .stTextInput > div > div > input:focus,
    .stNumberInput > div > div > input:focus {
        border-color: #0F7244 !important;
        box-shadow: 0 0 0 2px rgba(15, 114, 68, 0.2) !important;
    }

    /* ── Tabs ──────────────────────────────────────────────────── */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background: transparent;
        border-bottom: 2px solid #E2E8F0;
        padding: 0;
    }

    .stTabs [data-baseweb="tab"] {
        border-radius: 0;
        color: #64748B;
        font-weight: 600;
        padding: 12px 16px;
        background: transparent;
    }

    .stTabs [aria-selected="true"] {
        color: #0F7244 !important;
        background: transparent !important;
        border-bottom: 2px solid #0F7244 !important;
    }

    /* ── Mini stat cards ───────────────────────────────────────── */
    .mini-stat {
        padding: 16px;
        text-align: center;
        border: none;
        background: #FFFFFF;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .mini-stat-value {
        font-family: 'Outfit', sans-serif;
        font-size: 24px;
        font-weight: 700;
        color: #1E293B;
    }

    .mini-stat-label {
        font-size: 12px;
        color: #64748B;
        margin-top: 4px;
        font-weight: 500;
    }

    /* ── Hide Streamlit branding ───────────────────────────────── */
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
    </style>
    """


def savings_counter_html(amount, trend_pct, alerts_count, kwh_saved):
    """Génère le HTML du compteur de gains héros."""
    return f"""
    <div class="savings-hero">
        <div class="savings-label">Économies réalisées ce mois</div>
        <div class="savings-amount counter-animate">{amount:,.0f} FCFA</div>
        <div class="savings-trend">
            <span class="arrow">↑</span> +{trend_pct:.0f}% par rapport au mois dernier
        </div>
        <div style="display: flex; justify-content: center; gap: 24px; margin-top: 24px;">
            <div class="mini-stat">
                <div class="mini-stat-value">{alerts_count}</div>
                <div class="mini-stat-label">Alertes détectées</div>
            </div>
            <div class="mini-stat">
                <div class="mini-stat-value">{kwh_saved:.1f}</div>
                <div class="mini-stat-label">kWh économisés</div>
            </div>
        </div>
    </div>
    """


def metric_card_html(icon, value, label, delta=None, delta_type="positive"):
    """Génère le HTML d'une carte métrique."""
    delta_html = ""
    if delta:
        delta_html = f'<div class="metric-delta {delta_type}">{delta}</div>'
    
    # Optional icon if provided, otherwise empty
    icon_html = f'<span style="font-size: 20px; color: #0F7244;">{icon}</span>' if icon else ""
    
    return f"""
    <div class="metric-card">
        <div class="metric-header">
            <span class="metric-label">{label}</span>
            {icon_html}
        </div>
        <div class="metric-value">{value}</div>
        {delta_html}
    </div>
    """


def alert_item_html(alert):
    """Génère le HTML d'un item d'alerte."""
    return f"""
    <div class="alert-item {alert['severite']}">
        <div>
            <div class="alert-type">{alert['type']}</div>
            <div class="alert-message">{alert['message']}</div>
            <div class="alert-date">{alert['date']}</div>
        </div>
    </div>
    """


def progress_bar_html(label, value, max_val, color="green"):
    """Génère le HTML d'une barre de progression."""
    pct = min(100, (value / max_val) * 100) if max_val > 0 else 0
    return f"""
    <div class="progress-container">
        <div class="progress-label">
            <span>{label}</span>
            <span>{pct:.0f}%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill {color}" style="width: {pct}%"></div>
        </div>
    </div>
    """


def subscription_card_html(name, price, features, recommended=False, cible=""):
    """Génère le HTML d'une carte d'abonnement."""
    rec_badge = '<div class="sub-badge">Recommandé pour vous</div>' if recommended else ''
    rec_class = 'recommended' if recommended else ''
    
    price_display = "Gratuit" if price == 0 else f"{price:,.0f} FCFA"
    period_display = "" if price == 0 else "/mois"
    
    features_html = "".join(f"<li>{f}</li>" for f in features)
    
    return f"""
    <div class="sub-card {rec_class}">
        {rec_badge}
        <div class="sub-name">{name}</div>
        <div style="font-size: 13px; color: #64748B; margin-bottom: 12px;">{cible}</div>
        <div class="sub-price">{price_display}</div>
        <div class="sub-period">{period_display}</div>
        <ul class="sub-features">{features_html}</ul>
    </div>
    """
