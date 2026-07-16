'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'fr' | 'en';

const LANG_KEY = 'nk_lang';

const dict = {
  nav: {
    dashboard:   { fr: 'Tableau de Bord', en: 'Dashboard' },
    sites:       { fr: 'Sites',           en: 'Sites' },
    appareils:   { fr: 'Appareils',       en: 'Devices' },
    predictions: { fr: 'Assistant IA',    en: 'AI Assistant' },
    facturation: { fr: 'Facturation',     en: 'Billing' },
    admin:       { fr: 'Admin',           en: 'Admin' },
    navigation:  { fr: 'Navigation',      en: 'Navigation' },
    systemsUp:   { fr: 'Systèmes Opérationnels', en: 'Systems Operational' },
    adminPortal: { fr: 'Portail Admin',   en: 'Admin Portal' },
    apiConnected:{ fr: 'API Connectée',   en: 'API Connected' },
  },
  common: {
    save:      { fr: 'Enregistrer',       en: 'Save' },
    saving:    { fr: 'Enregistrement...', en: 'Saving...' },
    cancel:    { fr: 'Annuler',           en: 'Cancel' },
    close:     { fr: 'Fermer',            en: 'Close' },
    add:       { fr: 'Ajouter',           en: 'Add' },
    edit:      { fr: 'Gérer',             en: 'Manage' },
    loading:   { fr: 'Chargement...',     en: 'Loading...' },
    noResults: { fr: 'Aucun résultat',    en: 'No results' },
    search:    { fr: 'Rechercher des sites, appareils, pages...', en: 'Search sites, devices, pages...' },
    actif:     { fr: 'Actif',             en: 'Active' },
    alerte:    { fr: 'Alerte',            en: 'Alert' },
    logout:    { fr: 'Se déconnecter',    en: 'Log out' },
    myProfile: { fr: 'Mon Profil',        en: 'My Profile' },
    email:     { fr: 'Adresse Email',     en: 'Email Address' },
    password:  { fr: 'Mot de passe',      en: 'Password' },
    fullName:  { fr: 'Nom complet',       en: 'Full Name' },
    accountType:{ fr: 'Type de compte',   en: 'Account Type' },
    pages:     { fr: 'Pages',             en: 'Pages' },
    site:      { fr: 'Site',              en: 'Site' },
    devices:   { fr: 'Appareils',         en: 'Devices' },
  },
  landing: {
    title:      { fr: "Le Futur de l'Énergie", en: 'The Future of Energy' },
    subtitle:   { fr: 'Optimisez Votre Consommation, Maximisez Vos Économies.', en: 'Optimize Your Consumption, Maximize Your Savings.' },
    desc:       { fr: "NouanKanyAI est votre plateforme de gestion énergétique intelligente. Reprenez le contrôle de vos installations électriques : analysez votre consommation en temps réel, identifiez les gaspillages et laissez-nous automatiser vos équipements pour une rentabilité maximale.", en: 'NouanKanyAI is your smart energy management platform. Take back control of your electrical installations: analyze your consumption in real time, identify waste, and let us automate your equipment for maximum profitability.' },
    cta:        { fr: "Commencer l'Optimisation", en: 'Start Optimizing' },
    welcome:    { fr: 'Bienvenue', en: 'Welcome' },
    createAccount: { fr: 'Créer un compte', en: 'Create an account' },
    loginDesc:  { fr: 'Connectez-vous pour accéder à votre nœud industriel sécurisé.', en: 'Log in to access your secure industrial node.' },
    registerDesc: { fr: 'Rejoignez le réseau NouanKanyAI pour optimiser votre consommation.', en: 'Join the NouanKanyAI network to optimize your consumption.' },
    loginCta:   { fr: 'Accéder au panneau de contrôle', en: 'Access control panel' },
    registerCta:{ fr: 'Créer mon espace', en: 'Create my account' },
    switchToRegister: { fr: "Demander un accès entreprise (S'inscrire)", en: 'Request enterprise access (Sign up)' },
    switchToLogin: { fr: "J'ai déjà un identifiant. Se connecter", en: 'I already have an account. Log in' },
    or:         { fr: 'OU', en: 'OR' },
    welcomeBack: { fr: 'Bon retour', en: 'Welcome back' },
    loginSubtitle: { fr: 'Connectez-vous pour accéder à votre tableau de bord énergétique.', en: 'Log in to access your energy dashboard.' },
    forgotPassword: { fr: 'Oublié ?', en: 'Forgot?' },
    loginSubmit: { fr: 'Se connecter', en: 'Log in' },
    noAccount:  { fr: 'Pas de compte ? ', en: "Don't have an account? " },
    haveAccount: { fr: 'Déjà un compte ? ', en: 'Already have an account? ' },
    signupLink: { fr: 'Inscription', en: 'Sign up' },
    heroSlide1Title: { fr: "Le Futur de l'Énergie", en: 'The Future of Energy' },
    heroSlide1Desc: { fr: 'Analysez votre consommation en temps réel et laissez notre IA automatiser vos équipements pour une rentabilité maximale.', en: 'Analyze your consumption in real time and let our AI automate your equipment for maximum profitability.' },
    heroSlide2Title: { fr: 'Une IA qui Surveille Votre Réseau 24/7', en: 'An AI That Watches Your Grid 24/7' },
    heroSlide2Desc: { fr: 'Nos modèles de Machine Learning anticipent les pannes, préviennent les surchauffes et sécurisent votre production.', en: 'Our Machine Learning models anticipate failures, prevent overheating, and secure your production.' },
    previewOverview: { fr: "Vue d'ensemble de votre infrastructure.", en: 'Overview of your infrastructure.' },
    previewAlertDetail: { fr: 'Surchauffe — Pompe Hydraulique 09', en: 'Overheating — Hydraulic Pump 09' },
    previewConsumption: { fr: 'Consommation', en: 'Consumption' },
    previewSavings: { fr: 'Économies', en: 'Savings' },
    previewSystemsOk: { fr: 'Systèmes opérationnels · Tout va bien', en: 'Systems operational · All good' },
    toastAccountCreated: { fr: 'Compte créé avec succès ! Redirection en cours...', en: 'Account created successfully! Redirecting...' },
    toastLoginSuccess: { fr: 'Connexion réussie ! Redirection en cours...', en: 'Login successful! Redirecting...' },
    genericError: { fr: 'Une erreur est survenue', en: 'An error occurred' },
  },
  dashboardHome: {
    hello:          { fr: 'Bonjour', en: 'Hello' },
    overview:       { fr: "Voici la vue d'ensemble de votre infrastructure énergétique.", en: 'Here is the overview of your energy infrastructure.' },
    activeAlerts:   { fr: 'alertes actives', en: 'active alerts' },
    viewAllAlerts:  { fr: 'Voir toutes les alertes', en: 'View all alerts' },
    moreAlerts:     { fr: 'autres alertes', en: 'more alerts' },
    consumptionToday: { fr: "Consommation (Aujourd'hui)", en: 'Consumption (Today)' },
    activeDevices:  { fr: 'appareil(s) actif(s) sur', en: 'active device(s) out of' },
    savingsMonth:   { fr: 'Économies Générées (Mois)', en: 'Savings Generated (Month)' },
    verifiedSavings:{ fr: 'Économies vérifiées (actions IA journalisées ce mois)', en: 'Verified savings (AI actions logged this month)' },
    consumptionEvolution: { fr: 'Évolution de la consommation', en: 'Consumption Trend' },
    energyHungry:   { fr: 'Appareils Énergivores', en: 'Top Energy Consumers' },
    viewAll:        { fr: 'Voir tout', en: 'View all' },
  },
  appareils: {
    title:        { fr: 'Équipements Enregistrés', en: 'Registered Equipment' },
    subtitle:     { fr: 'Surveillance en temps réel et diagnostics IA sur', en: 'Real-time monitoring and AI diagnostics on' },
    activeDevices:{ fr: 'équipements actifs', en: 'active devices' },
    analyzeMedia: { fr: 'Analyser Flux Vidéo (IA)', en: 'Analyze Video Feed (AI)' },
    simulateAlert:{ fr: 'Simuler Capteur (Alerte)', en: 'Simulate Sensor (Alert)' },
    addDevice:    { fr: 'Ajouter un Équipement', en: 'Add a Device' },
    totalPower:   { fr: 'Puissance Totale', en: 'Total Power' },
    avgHealth:    { fr: 'Santé IA Moyenne', en: 'Avg. AI Health' },
    activeAlerts: { fr: 'Alertes Actives', en: 'Active Alerts' },
    avgPower:     { fr: 'Puissance Moyenne', en: 'Average Power' },
    filterBySite: { fr: 'Filtrer par Site :', en: 'Filter by Site:' },
    allSites:     { fr: 'Tous les sites', en: 'All sites' },
    showing:      { fr: 'Affichage de', en: 'Showing' },
    of:           { fr: 'sur', en: 'of' },
    devicesWord:  { fr: 'équipements', en: 'devices' },
    temperature:  { fr: 'Température', en: 'Temperature' },
    vibrations:   { fr: 'Vibrations', en: 'Vibrations' },
    aiOptimization: { fr: 'Optimisation IA', en: 'AI Optimization' },
    interventionRequired: { fr: 'Intervention Requise', en: 'Intervention Required' },
    launchDiagnostic: { fr: "Lancer Diagnostic d'Urgence", en: 'Launch Emergency Diagnostic' },
    diagnostics:  { fr: 'Diagnostics', en: 'Diagnostics' },
  },
  predictions: {
    title:        { fr: 'Optimisez votre consommation', en: 'Optimize your consumption' },
    subtitle:     { fr: 'Recommandations & Conseils', en: 'Recommendations & Tips' },
    configThresholds: { fr: "Configurer les seuils d'alerte", en: 'Configure alert thresholds' },
    alertsHeader: { fr: 'ALERTES — INTERVENTION HUMAINE REQUISE', en: 'ALERTS — HUMAN INTERVENTION REQUIRED' },
    tipsHeader:   { fr: 'CONSEILS & OPTIMISATIONS', en: 'TIPS & OPTIMIZATIONS' },
    noRecommendations: { fr: "Aucune recommandation pour le moment. Votre installation est optimale !", en: 'No recommendations for now. Your setup is optimal!' },
    resolvedByAI: { fr: "Résolu automatiquement par l'IA", en: 'Automatically resolved by AI' },
    thresholdsTitle: { fr: "Seuils d'alerte", en: 'Alert Thresholds' },
    thresholdsDesc: { fr: "Définissez à partir de quand l'IA doit déclencher une alerte critique sur vos équipements.", en: 'Set when the AI should trigger a critical alert on your equipment.' },
    tempThreshold: { fr: 'Température maximale avant alerte (°C)', en: 'Maximum temperature before alert (°C)' },
    vibThreshold: { fr: 'Vibration maximale avant alerte (Hz)', en: 'Maximum vibration before alert (Hz)' },
    ratioThreshold: { fr: 'Sensibilité à la surconsommation (multiplicateur vs. prédiction IA)', en: 'Overconsumption sensitivity (multiplier vs. AI prediction)' },
    desc: { fr: "L'IA analyse vos équipements en continu (XGBoost, Isolation Forest et notre catalogue d'équipements) pour vous alerter sur les urgences et vous conseiller sur des actions concrètes — y compris remplacer un appareil par un modèle équivalent mais plus économe. Pour discuter avec l'assistant, utilisez la bulle de chat en bas à droite.", en: "The AI continuously analyzes your equipment (XGBoost, Isolation Forest, and our equipment catalog) to alert you to emergencies and advise you on concrete actions — including replacing a device with an equivalent but more energy-efficient model. To chat with the assistant, use the chat bubble in the bottom right." },
    ratioHint: { fr: 'Ex: 1.2 = alerte si la consommation actuelle dépasse de 20% la prédiction normale de l\'IA.', en: "E.g.: 1.2 = alert if current consumption exceeds the AI's normal prediction by 20%." },
    criticalAction: { fr: 'ACTION CRITIQUE — INTERVENTION HUMAINE REQUISE', en: 'CRITICAL ACTION — HUMAN INTERVENTION REQUIRED' },
    estimatedGain: { fr: 'GAIN ESTIMÉ', en: 'ESTIMATED GAIN' },
  },
  facturation: {
    title:        { fr: 'Portail de Transparence Financière', en: 'Financial Transparency Portal' },
    subtitle:     { fr: 'Audit en temps réel du modèle de partage à 10% (Gain-Share) sur les économies industrielles.', en: 'Real-time audit of the 10% Gain-Share model on industrial savings.' },
    breadcrumb:   { fr: 'Facturation & Transparence', en: 'Billing & Transparency' },
    verifiedSavings: { fr: 'Économies Totales Vérifiées (Ce Mois)', en: 'Total Verified Savings (This Month)' },
    grossSavings: { fr: 'Économies Brutes', en: 'Gross Savings' },
    gainShareLabel: { fr: 'Gain-Share (10%)', en: 'Gain-Share (10%)' },
    dynamicApi:   { fr: '↗ Dynamique (API)', en: '↗ Live (API)' },
    downloadAudit:{ fr: "Télécharger l'Audit", en: 'Download Audit' },
    auditTrail:   { fr: "Journal d'Audit", en: 'Audit Log' },
    noRecentAudit:{ fr: 'Aucun audit récent', en: 'No recent audit' },
    tamperProof:  { fr: 'REGISTRE INFALSIFIABLE', en: 'TAMPER-PROOF LEDGER' },
    colTimestamp: { fr: 'HORODATAGE (UTC)', en: 'TIMESTAMP (UTC)' },
    colAction:    { fr: 'ACTION', en: 'ACTION' },
    colRef:       { fr: 'RÉFÉRENCE HASH', en: 'HASH REFERENCE' },
    colStatus:    { fr: 'STATUT', en: 'STATUS' },
    viewFullLedger: { fr: 'VOIR LE REGISTRE BLOCKCHAIN COMPLET', en: 'VIEW FULL BLOCKCHAIN LEDGER' },
    ledgerSoon:   { fr: "Le registre complet n'est pas encore disponible — bientôt ici.", en: 'The full ledger is not yet available — coming soon.' },
    billsForecast:{ fr: 'Factures & Prévisions IA', en: 'Bills & AI Forecasts' },
    billsDesc:    { fr: "Importez vos vraies factures d'électricité (photo ou saisie manuelle) pour que l'IA base ses prévisions et ses optimisations sur votre historique réel. Quand le mois prévu arrive, entrez le montant réel pour que l'IA affine sa précision.", en: "Import your real electricity bills (photo or manual entry) so the AI can base its forecasts and optimizations on your actual history. When the predicted month arrives, enter the real amount so the AI can refine its accuracy." },
    uploadBill:   { fr: 'Prendre en photo / Importer une facture', en: 'Take a photo / Import a bill' },
    analyzing:    { fr: 'Analyse en cours...', en: 'Analyzing...' },
    generateForecast: { fr: 'Générer la prévision du mois prochain', en: "Generate next month's forecast" },
    manualEntry:  { fr: 'Ou saisir une ancienne facture manuellement', en: 'Or enter an old bill manually' },
    monthPlaceholder: { fr: 'Ex: Juin 2026', en: 'E.g.: June 2026' },
    amountPlaceholder: { fr: 'Montant (FCFA)', en: 'Amount (FCFA)' },
    validate:     { fr: 'Valider', en: 'Confirm' },
    badgeForecast:{ fr: 'PRÉVISION IA', en: 'AI FORECAST' },
    badgePhoto:   { fr: 'PHOTO', en: 'PHOTO' },
    badgeManual:  { fr: 'MANUEL', en: 'MANUAL' },
    actualReceived: { fr: "La facture réelle est arrivée — entrer le montant réel", en: 'The real bill has arrived — enter the actual amount' },
    noBills:      { fr: "Aucune facture pour le moment. Importez votre première facture pour démarrer les prévisions IA.", en: 'No bills yet. Import your first bill to start AI forecasts.' },
    automatedSettlement: { fr: 'Règlement Automatisé', en: 'Automated Settlement' },
    connected:    { fr: 'CONNECTÉ', en: 'CONNECTED' },
    backupConfig: { fr: 'CONFIG. SECOURS', en: 'BACKUP CONFIG' },
    change:       { fr: 'CHANGER', en: 'CHANGE' },
    paymentSoon:  { fr: 'Gestion des méthodes de paiement bientôt disponible.', en: 'Payment method management coming soon.' },
    nextCycle:    { fr: 'PROCHAIN CYCLE DE FACTURATION', en: 'NEXT BILLING CYCLE' },
    commissionHistory: { fr: 'Historique des Commissions (10%)', en: 'Commission History (10%)' },
    download:     { fr: 'TÉLÉCHARGER', en: 'DOWNLOAD' },
    noInvoices:   { fr: 'Aucune facture disponible', en: 'No invoices available' },
    modelSplit:   { fr: 'RÉPARTITION DU MODÈLE', en: 'MODEL SPLIT' },
    retainedSavings: { fr: 'Économies Conservées (90%)', en: 'Retained Savings (90%)' },
    commissionSplit: { fr: 'Commission Gain-Share (10%)', en: 'Gain-Share Commission (10%)' },
    notifBillImported: { fr: 'Facture importée avec succès.', en: 'Bill imported successfully.' },
    notifUploadError: { fr: "Erreur lors de l'analyse de la facture.", en: 'Error analyzing the bill.' },
    notifForecastGenerated: { fr: 'Prévision générée pour', en: 'Forecast generated for' },
    notifForecastError: { fr: 'Erreur lors de la génération de la prévision.', en: 'Error generating the forecast.' },
    notifActualSaved: { fr: "Montant réel enregistré — l'IA recalibre ses prochaines prévisions.", en: "Actual amount saved — the AI is recalibrating its next forecasts." },
    notifActualError: { fr: "Erreur lors de l'enregistrement.", en: 'Error saving.' },
    notifBillAdded: { fr: "Facture ajoutée à l'historique.", en: 'Bill added to history.' },
    notifAddError: { fr: "Erreur lors de l'ajout.", en: 'Error adding bill.' },
    notifAuditDownloaded: { fr: "Rapport d'audit téléchargé.", en: 'Audit report downloaded.' },
    notifInvoiceDownloaded: { fr: 'Facture téléchargée.', en: 'Invoice downloaded.' },
    actualLabel: { fr: 'Réel', en: 'Actual' },
    vsForecast: { fr: 'vs. prévision', en: 'vs. forecast' },
  },
  sites: {
    title:      { fr: 'Sites Industriels', en: 'Industrial Sites' },
    breadcrumb: { fr: 'Gestion des Sites', en: 'Site Management' },
    subtitle:   { fr: "Supervisez la consommation énergétique de l'ensemble de vos installations géographiques.", en: 'Monitor energy consumption across all your geographic sites.' },
    addSite:    { fr: 'Ajouter un nouveau site', en: 'Add a new site' },
    addSiteBtn: { fr: '+ Ajouter un Site', en: '+ Add a Site' },
    name:       { fr: 'Nom', en: 'Name' },
    siteName:   { fr: 'Nom du site', en: 'Site name' },
    location:   { fr: 'Localisation', en: 'Location' },
    currentLoad:{ fr: 'Charge Actuelle', en: 'Current Load' },
    connectedDevices: { fr: 'Appareils Connectés', en: 'Connected Devices' },
    aiStatus:   { fr: 'Statut IA', en: 'AI Status' },
    alertsCount:{ fr: 'Alerte(s)', en: 'Alert(s)' },
    optimal:    { fr: 'Optimal', en: 'Optimal' },
    manageSite: { fr: 'Gérer le site', en: 'Manage site' },
  },
  admin: {
    title:        { fr: 'Centre de Contrôle Global', en: 'Global Control Center' },
    subtitle:     { fr: 'Supervision globale de l\'infrastructure, gestion des comptes et statistiques d\'activité des utilisateurs.', en: "Global oversight of infrastructure, account management, and user activity statistics." },
    userDirectory:{ fr: 'Annuaire des Utilisateurs', en: 'User Directory' },
    manage:       { fr: 'Gérer', en: 'Manage' },
    modelHealth:  { fr: 'Santé des Modèles Prédictifs', en: 'Predictive Model Health' },
    systemStatus: { fr: 'État du Système', en: 'System Status' },
    active:       { fr: 'ACTIF', en: 'ACTIVE' },
    online:       { fr: 'EN LIGNE', en: 'ONLINE' },
    savings:      { fr: 'ÉCONOMIES', en: 'SAVINGS' },
    revenue:      { fr: 'REVENU', en: 'REVENUE' },
    industrialSites: { fr: 'Sites Industriels', en: 'Industrial Sites' },
    supervisedMachines: { fr: 'Machines Supervisées', en: 'Supervised Machines' },
    globalImpact: { fr: 'Impact Énergétique (Global)', en: 'Energy Impact (Global)' },
    mrr:          { fr: 'MRR (Gain-Share 10%)', en: 'MRR (Gain-Share 10%)' },
    userCol:      { fr: 'Utilisateur', en: 'User' },
    roleCol:      { fr: 'Rôle', en: 'Role' },
    sitesCol:     { fr: 'Sites', en: 'Sites' },
    machinesCol:  { fr: 'Machines', en: 'Machines' },
    lastActivity: { fr: 'Dernière Activité', en: 'Last Activity' },
    statusCol:    { fr: 'Statut', en: 'Status' },
    noUsers:      { fr: 'Aucun utilisateur enregistré.', en: 'No registered users.' },
    recentActivities: { fr: 'Activités Récentes des Utilisateurs', en: 'Recent User Activities' },
    noActivities: { fr: 'Aucune activité enregistrée', en: 'No activity recorded' },
    activityTypeDelestage: { fr: 'Délestage automatique', en: 'Automatic load shedding' },
    activityTypeResetAdmin: { fr: 'Réinitialisation admin', en: 'Admin reset' },
    activityTypeOcrUpload: { fr: 'Téléversement facture', en: 'Bill upload' },
    activityTypeConnexion: { fr: 'Connexion', en: 'Login' },
    activityTypeAnalyseMediaNormal: { fr: 'Analyse média — normal', en: 'Media analysis — normal' },
    activityTypeAnalyseMediaAlerte: { fr: 'Analyse média — alerte', en: 'Media analysis — alert' },
    activityTypeUnknown: { fr: 'Activité', en: 'Activity' },
    activitySourceGemini: { fr: 'IA', en: 'AI' },
    activitySourceFallback: { fr: 'Repli local', en: 'Local fallback' },
    deletedUser: { fr: 'Utilisateur supprimé', en: 'Deleted user' },
    modelMetricR2: { fr: 'R² (XGBOOST)', en: 'R² (XGBOOST)' },
    modelMetricMae: { fr: 'MAE (XGBOOST)', en: 'MAE (XGBOOST)' },
    modelMetricMape: { fr: 'MAPE (XGBOOST)', en: 'MAPE (XGBOOST)' },
    modelMetricNotEvaluated: { fr: 'Modèle non évalué', en: 'Model not evaluated' },
    modelMetricMeasuredOn: { fr: 'Mesuré sur', en: 'Measured on' },
    modelMetricDatasetSynthetic: { fr: 'données de simulation', en: 'simulation data' },
    anomaliesDetected: { fr: 'ANOMALIES DÉTECTÉES', en: 'ANOMALIES DETECTED' },
    retrainModels: { fr: 'Réentraîner les modèles', en: 'Retrain models' },
    retrainSoon:  { fr: "Le ré-entraînement à la demande depuis l'interface n'est pas encore disponible.", en: 'On-demand retraining from the interface is not yet available.' },
    serverUptime: { fr: 'Serveur actif depuis', en: 'Server active for' },
    uptimeSeconds:{ fr: 'Quelques secondes', en: 'A few seconds' },
    dbStatus:     { fr: 'Base de Données', en: 'Database' },
    systemsOperational: { fr: 'Systèmes Opérationnels', en: 'Systems Operational' },
    avgLatency:   { fr: 'Latence API', en: 'API Latency' },
    manageUser:   { fr: 'Gérer', en: 'Manage' },
    platformRole: { fr: 'Rôle plateforme', en: 'Platform role' },
    adminHelperText: { fr: 'Un administrateur peut assister les clients mais ne peut pas gérer les rôles.', en: 'An admin can assist clients but cannot manage roles.' },
    demote:       { fr: 'Rétrograder', en: 'Demote' },
    promote:      { fr: 'Promouvoir en Admin', en: 'Promote to Admin' },
    savingsMonth: { fr: 'ÉCONOMIES (MOIS)', en: 'SAVINGS (MONTH)' },
    cieBills:     { fr: 'FACTURES CIE', en: 'CIE BILLS' },
    gainShareInvoices: { fr: 'FACTURES GAIN-SHARE', en: 'GAIN-SHARE INVOICES' },
    equipment:    { fr: 'ÉQUIPEMENTS', en: 'EQUIPMENT' },
    noEquipment:  { fr: 'Aucun équipement enregistré pour cet utilisateur.', en: 'No equipment registered for this user.' },
    reset:        { fr: 'Réinitialiser', en: 'Reset' },
    resetDone:    { fr: 'réinitialisé.', en: 'reset.' },
    resetError:   { fr: 'Erreur lors de la réinitialisation.', en: 'Error during reset.' },
    nowAdmin:     { fr: 'est maintenant administrateur.', en: 'is now an administrator.' },
    noLongerAdmin:{ fr: "n'est plus administrateur.", en: 'is no longer an administrator.' },
    roleChangeError: { fr: 'Erreur lors du changement de rôle.', en: 'Error changing role.' },
    loadingMetrics: { fr: 'Chargement des métriques globales...', en: 'Loading global metrics...' },
    loadError:    { fr: 'Impossible de charger les métriques. Vérifiez que le backend est lancé.', en: 'Unable to load metrics. Check that the backend is running.' },
    connectedAs:  { fr: 'Connecté en tant que', en: 'Logged in as' },
    logoutBtn:    { fr: 'Déconnexion', en: 'Log out' },
  },
};

type DictSection = keyof typeof dict;

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (section: DictSection, key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;
    if (saved === 'fr' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem(LANG_KEY, l);
  };

  const toggleLang = () => setLang(lang === 'fr' ? 'en' : 'fr');

  const t = (section: DictSection, key: string): string => {
    const sectionDict = dict[section] as Record<string, { fr: string; en: string }>;
    const entry = sectionDict?.[key];
    if (!entry) return key;
    return entry[lang];
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
