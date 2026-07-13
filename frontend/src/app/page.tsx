'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn, getCurrentUser } from '@/lib/auth';
import Image from 'next/image';

// NOTE: reprend le contenu de l'ancien HERO_SLIDES (voir src/_legacy/page-hero-carousel-legacy.tsx.txt)
// pour le texte défilant du panneau de droite.
const HERO_SLIDES = [
  {
    title: "Le Futur de l'Énergie",
    desc: "Analysez votre consommation en temps réel et laissez notre IA automatiser vos équipements pour une rentabilité maximale.",
  },
  {
    title: 'Une IA qui Surveille Votre Réseau 24/7',
    desc: "Nos modèles de Machine Learning anticipent les pannes, préviennent les surchauffes et sécurisent votre production.",
  },
];

export default function Home() {
  const router = useRouter();

  // Carousel State (texte défilant du panneau droit)
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auth Form States (logique inchangée par rapport à l'ancienne page)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [typeCompte, setTypeCompte] = useState('Particulier');

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Auto-scroll du texte du panneau droit
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Vérifie si une session existe déjà -> redirige direct vers le dashboard
  useEffect(() => {
    const checkSession = async () => {
      const user = await getCurrentUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'register') {
        await signUp(email, password, nom, typeCompte);
        showToast('Compte créé avec succès ! Redirection en cours...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        await signIn(email, password);
        showToast('Connexion réussie ! Redirection en cours...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* PANNEAU GAUCHE : formulaire connexion / inscription */}
        <div className="auth-form-container">
          <div className="form-wrapper">
            <div className="auth-logo-row">
              <Image
                src="/NouankanyAI.png"
                alt="NouanKanyAI Logo"
                width={40}
                height={40}
                style={{ objectFit: 'contain' }}
                priority
              />
              <span>NouanKanyAI</span>
            </div>

            <h1 className="auth-form-title">
              {authMode === 'login' ? 'Bon retour' : 'Créer un compte'}
            </h1>
            <p className="auth-form-subtitle">
              {authMode === 'login'
                ? 'Connectez-vous pour accéder à votre tableau de bord énergétique.'
                : 'Rejoignez le réseau NouanKanyAI pour optimiser votre consommation.'}
            </p>

            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="input-group">
                  <label className="input-label">Nom complet</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="vous@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <div className="auth-field-row">
                  <label className="input-label" style={{ marginBottom: 0 }}>
                    Mot de passe
                  </label>
                  {authMode === 'login' && <span className="auth-forgot-link">Oublié ?</span>}
                </div>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {authMode === 'register' && (
                <div className="input-group">
                  <label className="input-label">Type de compte</label>
                  <select
                    className="input-field"
                    style={{
                      appearance: 'none',
                      backgroundImage:
                        'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 16px top 50%',
                      backgroundSize: '12px auto',
                    }}
                    value={typeCompte}
                    onChange={(e) => setTypeCompte(e.target.value)}
                  >
                    <option value="Particulier">Particulier</option>
                    <option value="Entreprise">Entreprise</option>
                    <option value="Industriel">Industriel</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
                {loading ? 'Chargement...' : authMode === 'login' ? 'Se connecter' : 'Créer mon espace'}
              </button>
            </form>

            <div className="auth-switch-row">
              {authMode === 'login' ? 'Pas de compte ? ' : 'Déjà un compte ? '}
              <span
                className="auth-switch-link"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setError('');
                }}
              >
                {authMode === 'login' ? 'Inscription' : 'Se connecter'}
              </span>
            </div>
          </div>
        </div>

        {/* PANNEAU DROIT : aperçu sombre du dashboard */}
        <div className="auth-hero">
          <div className="auth-hero-topbar">
            <Image
              src="/NouankanyAI.png"
              alt="NouanKanyAI Logo"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
              priority
            />
            <span>NouanKanyAI</span>
          </div>

          <div className="auth-preview-card">
            <div className="auth-preview-card-header">
              <div className="auth-preview-logo">
                <Image src="/NouankanyAI.png" alt="Logo" width={20} height={20} style={{ objectFit: 'contain' }} />
                <span>NouanKanyAI</span>
              </div>
              <span className="status-badge status-connected">API CONNECTÉE</span>
            </div>

            <div className="auth-preview-greeting">Bonjour, Salimata</div>
            <div className="auth-preview-desc">Vue d'ensemble de votre infrastructure.</div>

            <div className="auth-preview-alert">
              <div className="auth-preview-alert-title">
                <span className="dot" /> 9 alertes actives
              </div>
              <div className="auth-preview-alert-detail">Surchauffe — Pompe Hydraulique 09</div>
            </div>

            <div className="auth-preview-stats">
              <div className="auth-preview-stat">
                <div className="auth-preview-stat-label">Consommation</div>
                <div className="auth-preview-stat-value">482 kWh</div>
              </div>
              <div className="auth-preview-stat">
                <div className="auth-preview-stat-label">Économies</div>
                <div className="auth-preview-stat-value">+12%</div>
              </div>
            </div>
          </div>

          <div className="auth-hero-status">
            <span className="dot" /> Systèmes opérationnels · Tout va bien
          </div>

          <h2 className="auth-hero-footer-title">{HERO_SLIDES[currentSlide].title}</h2>
          <p className="auth-hero-footer-desc">{HERO_SLIDES[currentSlide].desc}</p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            backgroundColor: '#10b981',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '12px',
            fontWeight: 600,
            zIndex: 99999,
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'fadeInUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          <span style={{ fontSize: '18px' }}>✓</span>
          {toastMessage}
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
        }}
      />
    </div>
  );
}
