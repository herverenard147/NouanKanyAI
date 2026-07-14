'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn, getCurrentUser } from '@/lib/auth';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();

  const HERO_SLIDES = [
    { title: t('landing', 'heroSlide1Title'), desc: t('landing', 'heroSlide1Desc') },
    { title: t('landing', 'heroSlide2Title'), desc: t('landing', 'heroSlide2Desc') },
  ];

  // Carousel State (texte défilant du panneau droit)
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auth Form States (logique inchangée par rapport à l'ancienne page)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const typeCompte = 'Particulier';

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
  // (ou le portail admin pour les comptes admin/superadmin)
  useEffect(() => {
    const checkSession = async () => {
      const user = await getCurrentUser();
      if (user) {
        router.push(user.platform_role ? '/admin-portal' : '/dashboard');
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
        const user = await signUp(email, password, nom, typeCompte);
        showToast(t('landing', 'toastAccountCreated'));
        setTimeout(() => {
          router.push(user.platform_role ? '/admin-portal' : '/dashboard');
        }, 1200);
      } else {
        const user = await signIn(email, password);
        showToast(t('landing', 'toastLoginSuccess'));
        setTimeout(() => {
          router.push(user.platform_role ? '/admin-portal' : '/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || t('landing', 'genericError'));
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
              {authMode === 'login' ? t('landing', 'welcomeBack') : t('landing', 'createAccount')}
            </h1>
            <p className="auth-form-subtitle">
              {authMode === 'login' ? t('landing', 'loginSubtitle') : t('landing', 'registerDesc')}
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
                  <label className="input-label">{t('common', 'fullName')}</label>
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
                <label className="input-label">{t('common', 'email')}</label>
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
                    {t('common', 'password')}
                  </label>
                  {authMode === 'login' && <span className="auth-forgot-link">{t('landing', 'forgotPassword')}</span>}
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

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
                {loading ? t('common', 'loading') : authMode === 'login' ? t('landing', 'loginSubmit') : t('landing', 'registerCta')}
              </button>
            </form>

            <div className="auth-switch-row">
              {authMode === 'login' ? t('landing', 'noAccount') : t('landing', 'haveAccount')}
              <span
                className="auth-switch-link"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setError('');
                }}
              >
                {authMode === 'login' ? t('landing', 'signupLink') : t('landing', 'loginSubmit')}
              </span>
            </div>
          </div>
        </div>

        {/* PANNEAU DROIT : aperçu sombre du dashboard */}
        <div className="auth-hero">
          <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 25, display: 'flex', gap: '8px' }}>
            <ThemeToggle dark />
            <LanguageToggle dark />
          </div>
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
              <span className="status-badge status-connected">{t('nav', 'apiConnected')}</span>
            </div>

            <div className="auth-preview-greeting">{t('dashboardHome', 'hello')}, Salimata</div>
            <div className="auth-preview-desc">{t('landing', 'previewOverview')}</div>

            <div className="auth-preview-alert">
              <div className="auth-preview-alert-title">
                <span className="dot" /> 9 {t('dashboardHome', 'activeAlerts')}
              </div>
              <div className="auth-preview-alert-detail">{t('landing', 'previewAlertDetail')}</div>
            </div>

            <div className="auth-preview-stats">
              <div className="auth-preview-stat">
                <div className="auth-preview-stat-label">{t('landing', 'previewConsumption')}</div>
                <div className="auth-preview-stat-value">482 kWh</div>
              </div>
              <div className="auth-preview-stat">
                <div className="auth-preview-stat-label">{t('landing', 'previewSavings')}</div>
                <div className="auth-preview-stat-value">+12%</div>
              </div>
            </div>
          </div>

          <div className="auth-hero-status">
            <span className="dot" /> {t('landing', 'previewSystemsOk')}
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
