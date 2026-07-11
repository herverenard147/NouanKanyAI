'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Zap, Target } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) return null;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          Bonjour, {user.nom.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#A0AEC0', fontSize: '16px' }}>
          Voici le résumé de votre consommation énergétique d'aujourd'hui.
        </p>
      </div>

      <div className="kpi-grid">
        {/* KPI 1 */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: '#A0AEC0', fontSize: '14px', fontWeight: 500 }}>Consommation Actuelle</div>
            <div style={{ backgroundColor: 'rgba(0, 176, 255, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <Zap size={20} color="var(--secondary)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'monospace', fontWeight: 700, marginBottom: '8px' }}>
            4.2 <span style={{ fontSize: '16px', color: '#A0AEC0' }}>kWh</span>
          </div>
          <div style={{ color: 'var(--primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} /> -12% depuis hier
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: '#A0AEC0', fontSize: '14px', fontWeight: 500 }}>Prévision Facture (Mois)</div>
            <div style={{ backgroundColor: 'rgba(0, 230, 118, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <Target size={20} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'monospace', fontWeight: 700, marginBottom: '8px' }}>
            28 400 <span style={{ fontSize: '16px', color: '#A0AEC0' }}>FCFA</span>
          </div>
          <div style={{ color: 'var(--accent)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            En dessous du budget (30k FCFA)
          </div>
        </div>
      </div>

      {/* Reste du dashboard (Graphiques, Appareils...) */}
      <div className="glass-card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#A0AEC0' }}>[ Espace réservé pour le graphique de consommation Recharts ]</p>
      </div>
    </div>
  );
}
