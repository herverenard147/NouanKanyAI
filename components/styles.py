"""
EnergAI — CSS premium et styles injectés pour Streamlit.
Dark mode glassmorphism avec compteur de gains FCFA animé.
"""

def inject_custom_css():
    """Retourne le CSS custom à injecter via st.markdown."""
    return """
    <style>
    /* ══════════════════════════════════════════════════════════════
       ENERGAI — PREMIUM DARK THEME
       ══════════════════════════════════════════════════════════════ */
    
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap');

    /* ── Global ────────────────────────────────────────────────── */
    .stApp {
        background: linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%);
        font-family: 'Inter', sans-serif;
    }

    .stApp > header {
        background-color: transparent !important;
    }

    /* ── Sidebar ───────────────────────────────────────────────── */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #1A1A2E 0%, #0D1B2A 100%) !important;
        border-right: 1px solid rgba(0, 230, 118, 0.15);
    }
    
    [data-testid="stSidebar"] .stMarkdown h1,
    [data-testid="stSidebar"] .stMarkdown h2,
    [data-testid="stSidebar"] .stMarkdown h3 {
        color: #00E676 !important;
        font-family: 'Outfit', sans-serif;
    }

    /* ── Glassmorphism Cards ───────────────────────────────────── */
    .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 24px;
        margin: 8px 0;
        transition: all 0.3s ease;
    }
    
    .glass-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(0, 230, 118, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0, 230, 118, 0.1);
    }

    /* ── Hero Savings Counter ──────────────────────────────────── */
    .savings-hero {
        background: linear-gradient(135deg, rgba(0, 230, 118, 0.15) 0%, rgba(0, 176, 255, 0.15) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(0, 230, 118, 0.3);
        border-radius: 20px;
        padding: 32px 40px;
        margin: 16px 0 24px 0;
        text-align: center;
        position: relative;
        overflow: hidden;
    }

    .savings-hero::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(0, 230, 118, 0.08) 0%, transparent 60%);
        animation: pulse-glow 4s ease-in-out infinite;
    }

    @keyframes pulse-glow {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
    }

    .savings-label {
        font-family: 'Inter', sans-serif;
        font-size: 16px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 8px;
    }

    .savings-amount {
        font-family: 'Outfit', sans-serif;
        font-size: 56px;
        font-weight: 800;
        background: linear-gradient(90deg, #00E676, #00B0FF, #00E676);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: gradient-flow 3s linear infinite;
        line-height: 1.1;
        margin: 8px 0;
    }

    @keyframes gradient-flow {
        0% { background-position: 0% center; }
        100% { background-position: 200% center; }
    }

    .savings-trend {
        font-size: 18px;
        font-weight: 600;
        color: #00E676;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .savings-trend .arrow {
        font-size: 22px;
        animation: bounce-up 1.5s ease-in-out infinite;
    }

    @keyframes bounce-up {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
    }

    /* ── Metric Cards ──────────────────────────────────────────── */
    .metric-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
    }

    .metric-card:hover {
        border-color: rgba(0, 230, 118, 0.3);
        box-shadow: 0 4px 20px rgba(0, 230, 118, 0.1);
    }

    .metric-value {
        font-family: 'Outfit', sans-serif;
        font-size: 32px;
        font-weight: 700;
        color: #FFFFFF;
        margin: 8px 0 4px;
    }

    .metric-label {
        font-size: 13px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .metric-delta {
        font-size: 14px;
        font-weight: 600;
        margin-top: 4px;
    }

    .metric-delta.positive { color: #00E676; }
    .metric-delta.negative { color: #FF5252; }

    /* ── Alert Cards ───────────────────────────────────────────── */
    .alert-item {
        background: rgba(255, 255, 255, 0.04);
        border-left: 3px solid;
        border-radius: 0 12px 12px 0;
        padding: 14px 18px;
        margin: 8px 0;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        transition: all 0.2s ease;
    }

    .alert-item:hover {
        background: rgba(255, 255, 255, 0.07);
    }

    .alert-item.haute { border-left-color: #FF5252; }
    .alert-item.moyenne { border-left-color: #FFD600; }
    .alert-item.info { border-left-color: #00B0FF; }

    .alert-type {
        font-weight: 600;
        font-size: 14px;
        color: #FFFFFF;
    }

    .alert-message {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.5;
    }

    .alert-date {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        margin-top: 4px;
    }

    /* ── Progress Bars ─────────────────────────────────────────── */
    .progress-container {
        margin: 10px 0;
    }

    .progress-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
    }

    .progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 1s ease-out;
    }

    .progress-fill.green { background: linear-gradient(90deg, #00E676, #69F0AE); }
    .progress-fill.blue { background: linear-gradient(90deg, #00B0FF, #40C4FF); }
    .progress-fill.orange { background: linear-gradient(90deg, #FF9800, #FFB74D); }
    .progress-fill.red { background: linear-gradient(90deg, #FF5252, #FF8A80); }

    /* ── Auth Page ──────────────────────────────────────────────── */
    .auth-container {
        max-width: 480px;
        margin: 0 auto;
        padding: 40px;
    }

    .auth-header {
        text-align: center;
        margin-bottom: 32px;
    }

    .auth-logo {
        font-family: 'Outfit', sans-serif;
        font-size: 42px;
        font-weight: 800;
        background: linear-gradient(90deg, #00E676, #00B0FF);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 8px;
    }

    .auth-tagline {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.5;
    }

    .profile-card {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .profile-card:hover, .profile-card.selected {
        border-color: #00E676;
        background: rgba(0, 230, 118, 0.1);
        box-shadow: 0 0 20px rgba(0, 230, 118, 0.15);
    }

    .profile-icon {
        font-size: 48px;
        margin-bottom: 12px;
    }

    .profile-title {
        font-family: 'Outfit', sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: #FFFFFF;
    }

    .profile-desc {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 4px;
    }

    /* ── Subscription Cards ────────────────────────────────────── */
    .sub-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 28px;
        text-align: center;
        transition: all 0.3s ease;
        position: relative;
    }

    .sub-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }

    .sub-card.recommended {
        border-color: #00E676;
        background: rgba(0, 230, 118, 0.08);
        box-shadow: 0 0 30px rgba(0, 230, 118, 0.15);
    }

    .sub-badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(90deg, #00E676, #00B0FF);
        color: #1A1A2E;
        font-weight: 700;
        font-size: 12px;
        padding: 4px 16px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .sub-name {
        font-family: 'Outfit', sans-serif;
        font-size: 24px;
        font-weight: 700;
        color: #FFFFFF;
        margin: 12px 0 8px;
    }

    .sub-price {
        font-family: 'Outfit', sans-serif;
        font-size: 36px;
        font-weight: 800;
        color: #00E676;
    }

    .sub-period {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
    }

    .sub-features {
        text-align: left;
        margin: 20px 0;
        padding: 0;
        list-style: none;
    }

    .sub-features li {
        padding: 6px 0;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
    }

    .sub-features li::before {
        content: '✓ ';
        color: #00E676;
        font-weight: 700;
    }

    /* ── Section Headers ───────────────────────────────────────── */
    .section-header {
        font-family: 'Outfit', sans-serif;
        font-size: 22px;
        font-weight: 700;
        color: #FFFFFF;
        margin: 24px 0 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid rgba(0, 230, 118, 0.2);
    }

    /* ── Notification Badge ────────────────────────────────────── */
    .notif-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #FF5252;
        color: white;
        font-size: 11px;
        font-weight: 700;
        min-width: 20px;
        height: 20px;
        border-radius: 10px;
        padding: 0 6px;
        animation: pulse-badge 2s ease-in-out infinite;
    }

    @keyframes pulse-badge {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.4); }
        50% { box-shadow: 0 0 0 6px rgba(255, 82, 82, 0); }
    }

    /* ── Streamlit Overrides ───────────────────────────────────── */
    .stButton > button {
        background: linear-gradient(90deg, #00E676, #00C853) !important;
        color: #1A1A2E !important;
        font-weight: 700 !important;
        border: none !important;
        border-radius: 12px !important;
        padding: 12px 32px !important;
        font-size: 16px !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 4px 15px rgba(0, 230, 118, 0.3) !important;
    }

    .stButton > button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(0, 230, 118, 0.4) !important;
    }

    .stSelectbox > div > div,
    .stTextInput > div > div > input,
    .stNumberInput > div > div > input {
        background-color: rgba(255, 255, 255, 0.06) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        border-radius: 12px !important;
        color: #E0E0E0 !important;
    }

    .stSelectbox > div > div:focus-within,
    .stTextInput > div > div > input:focus,
    .stNumberInput > div > div > input:focus {
        border-color: #00E676 !important;
        box-shadow: 0 0 0 2px rgba(0, 230, 118, 0.2) !important;
    }

    /* ── Tabs ──────────────────────────────────────────────────── */
    .stTabs [data-baseweb="tab-list"] {
        gap: 0;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 4px;
    }

    .stTabs [data-baseweb="tab"] {
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 600;
        padding: 10px 20px;
    }

    .stTabs [aria-selected="true"] {
        background: linear-gradient(90deg, #00E676, #00C853) !important;
        color: #1A1A2E !important;
    }

    /* ── Counters Animation ────────────────────────────────────── */
    .counter-animate {
        animation: countUp 2s ease-out forwards;
    }

    @keyframes countUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* ── Mini stat cards ───────────────────────────────────────── */
    .mini-stat {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .mini-stat-value {
        font-family: 'Outfit', sans-serif;
        font-size: 22px;
        font-weight: 700;
        color: #00B0FF;
    }

    .mini-stat-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 4px;
    }

    /* ── Responsive ────────────────────────────────────────────── */
    @media (max-width: 768px) {
        .savings-amount { font-size: 36px; }
        .metric-value { font-size: 24px; }
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
        <div style="display: flex; justify-content: center; gap: 40px; margin-top: 20px;">
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
    
    return f"""
    <div class="metric-card">
        <div style="font-size: 28px;">{icon}</div>
        <div class="metric-value">{value}</div>
        <div class="metric-label">{label}</div>
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
        <div style="font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 8px;">{cible}</div>
        <div class="sub-price">{price_display}</div>
        <div class="sub-period">{period_display}</div>
        <ul class="sub-features">{features_html}</ul>
    </div>
    """
