'use client';

import { useState, useEffect } from 'react';
import { Activity, Server, ShieldAlert, Cpu, Globe, Zap, Database, CheckCircle, Network, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/admin/metrics');
        const json = await res.json();
        if (json && json.platform && !json.error) {
          setData(json);
        } else {
          console.error("Backend n'a pas retourné les bonnes données. Le serveur a-t-il été redémarré ?", json);
        }
      } catch (err) {
        console.error("Failed to fetch admin metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminMetrics();
  }, []);

  // Simulation data for the ML drift chart
  const driftData = [
    { time: '00:00', error: 4.2 },
    { time: '04:00', error: 4.8 },
    { time: '08:00', error: 5.1 },
    { time: '12:00', error: 6.2 },
    { time: '16:00', error: 5.8 },
    { time: '20:00', error: 5.5 },
    { time: '24:00', error: 5.8 },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--primary)' }}>
        Chargement des métriques globales...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', color: 'var(--text-muted)' }}>
        Impossible de charger les métriques. Vérifiez que le backend est lancé.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>
          <span style={{ color: 'var(--primary)' }}>NouanKanyAI</span> / MLOps & Platform Admin
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>Centre de Contrôle Global</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Supervision de l'infrastructure, santé des modèles IA (MLOps) et métriques de la plateforme.
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Globe color="var(--primary)" size={24} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '2px 8px', borderRadius: '12px' }}>ACTIF</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Sites Industriels</div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{data.platform.total_sites}</div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Zap color="#F59E0B" size={24} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>EN LIGNE</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Machines Supervisées</div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{data.platform.active_machines} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ {data.platform.total_machines}</span></div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Activity color="#10B981" size={24} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>ÉCONOMIES</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Impact Énergétique (Global)</div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>{data.platform.global_savings_xof.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>FCFA</span></div>
        </div>

        <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--primary)', backgroundColor: 'rgba(15, 114, 68, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Database color="var(--primary)" size={24} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFF', backgroundColor: 'var(--primary)', padding: '2px 8px', borderRadius: '12px' }}>REVENU</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>MRR (Gain-Share 10%)</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{data.platform.revenue_xof.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span style={{ fontSize: '14px' }}>FCFA</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* MLOps Dashboard */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--primary)" /> Santé des Modèles d'IA (MLOps)
            </h3>
            <button onClick={() => showNotification("Lancement du réentraînement des modèles XGBoost en arrière-plan...")} className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px', height: 'auto', border: 'none', cursor: 'pointer' }}>
              Réentraîner les modèles
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Précision XGBoost</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981' }}>{data.ml_health.xgboost_accuracy}%</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Erreur Moyenne (MAPE)</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B' }}>{data.ml_health.xgboost_mape}%</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Anomalies (Isolation Forest)</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#EF4444' }}>{data.ml_health.isolation_forest_anomalies_detected}</div>
            </div>
          </div>

          <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase' }}>Suivi de la dérive (Model Drift) - 24h</h4>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={driftData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="var(--surface-border)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis stroke="var(--surface-border)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px' }} />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                <Area type="monotone" dataKey="error" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorError)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System & API Status */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Server size={18} color="var(--primary)" /> État du Système
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Network size={20} color="var(--text-muted)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Disponibilité API</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latence: {data.system.avg_latency_ms} ms</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#10B981' }}>
                <CheckCircle size={14} /> {data.system.api_uptime}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Database size={20} color="var(--text-muted)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Base de Données</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Supabase Postgres</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#10B981' }}>
                <CheckCircle size={14} /> {data.system.database_status}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert size={20} color="var(--text-muted)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Registre d'Audit</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Empreinte cryptographique</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#10B981' }}>
                <CheckCircle size={14} /> {data.system.blockchain_ledger}
              </div>
            </div>
            
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '8px', marginTop: '8px', display: 'flex', gap: '12px' }}>
              <AlertTriangle color="#EF4444" size={20} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#EF4444', marginBottom: '4px' }}>Alerte Système (Test)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Le noeud A-12 (Zone Nord) montre une latence élevée depuis 4h.</div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {notification && (
        <div style={{ 
          position: 'fixed', 
          bottom: '32px', 
          right: '32px', 
          backgroundColor: 'var(--foreground)', 
          color: 'var(--background)', 
          padding: '16px 24px', 
          borderRadius: '8px', 
          fontWeight: 600, 
          zIndex: 1000, 
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle size={18} color="var(--primary)" />
          {notification}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
