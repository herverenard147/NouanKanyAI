'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = authMode === 'login' ? 'http://localhost:8000/api/login' : 'http://localhost:8000/api/register';
      
      const payload = authMode === 'login' 
        ? { email, password }
        : { nom, email, password, type_compte: typeCompte };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Une erreur est survenue');
      }

      const userData = await response.json();
      
      // Stocker l'utilisateur (simplifié pour le moment)
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Rediriger vers le tableau de bord
      alert("Connexion réussie ! Bienvenue " + userData.nom);
      router.push('/dashboard'); 
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left panel - Hero */}
      <div className="auth-hero">
        <h1 style={{ color: 'var(--primary)', fontSize: '48px', fontWeight: 800, marginBottom: '16px' }}>
          EnergAI
        </h1>
        <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '32px', lineHeight: 1.3 }}>
          Gérez votre consommation.<br />
          <span style={{ color: 'var(--secondary)' }}>Optimisez vos dépenses.</span>
        </h2>
        
        <div className="glass-card" style={{ maxWidth: '400px' }}>
          <div style={{ fontSize: '14px', color: '#A0AEC0', marginBottom: '8px' }}>
            Économies réalisées ce mois
          </div>
          <div style={{ fontSize: '36px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
            42 850 FCFA
          </div>
          <div style={{ color: 'var(--primary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>↑</span> +14% par rapport au mois dernier
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="auth-form-container">
        <div className="form-wrapper">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
              {authMode === 'login' ? 'Bienvenue' : 'Créer un compte'}
            </h3>
            <p style={{ color: '#A0AEC0', fontSize: '14px' }}>
              {authMode === 'login' 
                ? 'Connectez-vous pour accéder à votre tableau de bord' 
                : 'Rejoignez EnergAI pour optimiser votre consommation'}
            </p>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FFD600', color: '#000', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 500 }}>
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
                  placeholder="Kouamé Serge" 
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
                placeholder="vous@email.com" 
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
                  style={{ appearance: 'auto', backgroundColor: '#1A1A2E' }}
                  value={typeCompte}
                  onChange={(e) => setTypeCompte(e.target.value)}
                >
                  <option value="Particulier">Particulier</option>
                  <option value="Entreprise">Entreprise</option>
                  <option value="Industriel">Industriel</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '16px' }} disabled={loading}>
              {loading ? 'Chargement...' : (authMode === 'login' ? 'Se connecter' : 'Créer mon compte')}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {authMode === 'login' ? "Vous n'avez pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
