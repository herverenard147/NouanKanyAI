'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // States pour les inputs
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [typeCompte, setTypeCompte] = useState('Particulier');
  
  // États de chargement et d'erreur
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nom,
              type_compte: typeCompte
            }
          }
        });

        if (signUpError) throw signUpError;
        if (data.user) {
          alert("Compte créé avec succès ! Connectez-vous.");
          setAuthMode('login');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        
        // Ensure user is actually in the session
        if (data.session) {
          alert("Connexion réussie !");
          router.push('/dashboard');
        }
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
        
        {/* Left panel - Hero */}
        <div className="auth-hero">
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h1 style={{ color: 'var(--primary)', fontSize: '56px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              EnergAI
            </h1>
            <h2 style={{ fontSize: '24px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '40px', lineHeight: 1.4, maxWidth: '400px' }}>
              Gérez votre consommation.<br/>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Optimisez vos dépenses.</span>
            </h2>
            
            <div className="glass-card" style={{ maxWidth: '400px', background: '#FFFFFF', border: '1px solid var(--surface-border)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Économies validées ce mois
              </div>
              <div style={{ fontSize: '42px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                42 850 <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>FCFA</span>
              </div>
              <div style={{ color: 'var(--primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary-light)' }}>↑</span> 
                +14% par rapport au mois dernier
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - Form */}
        <div className="auth-form-container">
          <div className="form-wrapper">
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px', color: 'var(--foreground)' }}>
                {authMode === 'login' ? 'Bienvenue' : 'Créer un compte'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
                {authMode === 'login' 
                  ? 'Connectez-vous pour accéder à votre nœud industriel sécurisé.' 
                  : 'Rejoignez le réseau EnergAI pour optimiser votre consommation.'}
              </p>
            </div>

            {error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
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
                    style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }}
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
                {loading ? 'Chargement...' : (authMode === 'login' ? 'Accéder au panneau de contrôle' : 'Créer mon espace industriel')}
              </button>
            </form>

            <div style={{ marginTop: '32px', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--surface-border)', zIndex: 1 }}></div>
              <span style={{ position: 'relative', background: 'var(--background)', padding: '0 16px', color: 'var(--text-muted)', fontSize: '13px', zIndex: 2 }}>
                OU
              </span>
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setError('');
                }}
              >
                {authMode === 'login' ? "Demander un accès entreprise (S'inscrire)" : "J'ai déjà un identifiant. Se connecter"}
              </button>
            </div>
            
            <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              Protégé par cryptographie de bout en bout.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
