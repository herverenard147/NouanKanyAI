'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn, getCurrentUser } from '@/lib/auth';
import Image from 'next/image';

const HERO_SLIDES = [
  {
    image: '/hero_energy_control_1783840324094.png',
    title: "Le Futur de l'Énergie",
    subtitle: 'Optimisez Votre Consommation, Maximisez Vos Économies.',
    desc: "NouanKanyAI est votre plateforme de gestion énergétique intelligente. Reprenez le contrôle de vos installations électriques : analysez votre consommation en temps réel, identifiez les gaspillages et laissez-nous automatiser vos équipements pour une rentabilité maximale.",
  },
  {
    image: '/hero_ai_automation_1783840362282.png',
    title: 'Une IA qui Surveille Votre Réseau 24/7',
    subtitle: "Détectez les Anomalies Avant qu'elles ne Coûtent Cher.",
    desc: "Nos modèles de Machine Learning (XGBoost, Isolation Forest) analysent en continu vos machines et votre infrastructure électrique pour anticiper les pannes, prévenir les surchauffes et sécuriser votre production.",
  },
];

export default function Home() {
  const router = useRouter();
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form States
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

  // Auto-scroll Carousel
  useEffect(() => {
    if (showAuthModal) return; 
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000); // 6 seconds per slide
    
    return () => clearInterval(interval);
  }, [showAuthModal]);

  // Check existing session
  useEffect(() => {
    const checkSession = async () => {
      const user = await getCurrentUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const openAuthModal = (mode: 'login' | 'register' = 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setError('');
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'register') {
        await signUp(email, password, nom, typeCompte);
        showToast("Compte créé avec succès ! Redirection en cours...");
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        await signIn(email, password);
        showToast("Connexion réussie ! Redirection en cours...");
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
    <div className="hero-wrapper">
      {/* Background Images Carousel */}
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={`bg-${index}`}
          className={`hero-bg ${index === currentSlide ? 'active' : ''}`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            style={{ objectFit: 'cover' }}
            priority={index === 0}
          />
        </div>
      ))}

      {/* 3D Characters Overlay */}
      <div className="person-left">
        <Image src="/person_left_1783842128416.png" alt="Ingénieure" fill style={{ objectFit: 'contain', objectPosition: 'left center' }} priority />
      </div>
      <div className="person-right">
        <Image 
          src="/person_right_1783842141750.png" 
          alt="Scientifique" 
          fill 
          style={{ 
            objectFit: 'contain', 
            objectPosition: 'right center',
            filter: 'brightness(1.5) contrast(1.2)'
          }} 
          priority 
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className="hero-overlay"></div>

      {/* Main Content (Fixed) */}
      <div className="hero-content">
        <div className="glass-hero-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '28px' }}>
            <Image 
              src="/NouankanyAI.png" 
              alt="NouanKanyAI Logo" 
              width={56} 
              height={56} 
              style={{ objectFit: 'contain' }} 
              priority
            />
            <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#fff', letterSpacing: '-0.02em' }}>
              NouankanyAI
            </span>
          </div>
          <h1 className="hero-title">{HERO_SLIDES[currentSlide].title}</h1>
          <h2 className="hero-subtitle">{HERO_SLIDES[currentSlide].subtitle}</h2>
          <p className="hero-desc">
            {HERO_SLIDES[currentSlide].desc}
          </p>
          <div className="hero-actions">
            <button className="btn-glow" onClick={() => openAuthModal('register')}>
              Commencer l'Optimisation
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="hero-indicators">
        {HERO_SLIDES.map((_, index) => (
          <div 
            key={index} 
            className={`hero-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>

      {/* Auth Modal (Dark Mode Premium) */}
      <div className={`modal-overlay dark ${showAuthModal ? 'open' : ''}`}>
        <div className="modal-content dark">
          <button className="modal-close" onClick={closeAuthModal}>&times;</button>
          
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>
              {authMode === 'login' ? 'Bienvenue' : 'Créer un compte'}
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.5 }}>
              {authMode === 'login' 
                ? 'Connectez-vous pour accéder à votre nœud industriel sécurisé.' 
                : 'Rejoignez le réseau NouanKanyAI pour optimiser votre consommation.'}
            </p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>
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
              <label className="input-label">Adresse Email</label>
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
              <label className="input-label">Mot de passe</label>
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
                  style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }}
                  value={typeCompte}
                  onChange={(e) => setTypeCompte(e.target.value)}
                >
                  <option value="Particulier">Particulier</option>
                  <option value="Entreprise">Entreprise</option>
                  <option value="Industriel">Industriel</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn-glow" style={{ marginTop: '8px' }} disabled={loading}>
              {loading ? 'Chargement...' : (authMode === 'login' ? 'Accéder au panneau de contrôle' : 'Créer mon espace')}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(15,23,42,0.1)', zIndex: 1 }}></div>
            <span style={{ position: 'relative', background: 'var(--surface-solid)', padding: '0 16px', color: '#64748b', fontSize: '13px', zIndex: 2 }}>
              OU
            </span>
          </div>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button
              style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid rgba(15,23,42,0.1)', background: 'transparent', color: '#334155', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.04)'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#334155'; }}
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {authMode === 'login' ? "Demander un accès entreprise (S'inscrire)" : "J'ai déjà un identifiant. Se connecter"}
            </button>
          </div>
        </div>
      </div>
      {/* Beautiful Toast Notification */}
      {toastMessage && (
        <div style={{ 
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
          animation: 'fadeInUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <span style={{ fontSize: '18px' }}>✓</span>
          {toastMessage}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
