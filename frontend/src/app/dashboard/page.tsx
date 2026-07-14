'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Zap, Target, Power, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getCurrentUser, authHeaders } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';

// Génère un profil de consommation journalier réaliste à partir de la puissance totale des machines
function generateDailyProfile(totalKw: number) {
  const profile = [
    { time: '00h', hour: 0, factor: 0.3 },
    { time: '04h', hour: 4, factor: 0.2 },
    { time: '08h', hour: 8, factor: 0.75 },
    { time: '10h', hour: 10, factor: 1.0 },
    { time: '12h', hour: 12, factor: 0.9 },
    { time: '14h', hour: 14, factor: 1.0 },
    { time: '16h', hour: 16, factor: 0.95 },
    { time: '18h', hour: 18, factor: 0.85 },
    { time: '20h', hour: 20, factor: 0.65 },
    { time: '22h', hour: 22, factor: 0.45 },
  ];
  // N'affiche que les heures déjà écoulées aujourd'hui (pas d'heures "futures").
  const currentHour = new Date().getHours();
  return profile
    .filter(p => p.hour <= currentHour)
    .map(p => ({
      time: p.time,
      conso: parseFloat((totalKw * p.factor).toFixed(1))
    }));
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  
  // États pour les appareils venant de l'API
  const [machines, setMachines] = useState<any[]>([]);
  const [totalConso, setTotalConso] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [economiesMois, setEconomiesMois] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser({
          nom: currentUser.nom || currentUser.email,
          email: currentUser.email
        });
      } else {
        router.push('/');
      }
    };
    checkUser();
    
    // Fetch live machines state
    const fetchMachines = async () => {
      try {
        const res = await fetch(`${API_URL}/api/machines`, { headers: authHeaders() });
        const data = await res.json();
        setMachines(data);
        
        // Calculate total consumption dynamically
        const total = data.reduce((acc: number, m: any) => acc + (m.status === 'actif' ? m.power_kw : 0), 0);
        setTotalConso(total);
        
        // Generate realistic chart data from real machine power
        setChartData(generateDailyProfile(total));

        // Économies réellement vérifiées ce mois-ci (actions IA journalisées dans l'audit),
        // pas une simulation — vient du même calcul que la page Facturation.
        try {
          const factRes = await fetch(`${API_URL}/api/facturation`, { headers: authHeaders() });
          const factData = await factRes.json();
          setEconomiesMois(factData.grossSavings || 0);
        } catch {
          setEconomiesMois(0);
        }

        // Fetch AI recommendation
        if (data.length > 0) {
          const recRes = await fetch(`${API_URL}/api/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(data)
          });
          const recData = await recRes.json();
          if (recData.recommendations) {
            setAlerts(recData.recommendations.filter((r: any) => r.type === 'alerte'));
          } else {
            setAlerts([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch machines/recommendations:", err);
      }
    };
    
    fetchMachines();
    const interval = setInterval(fetchMachines, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>
            {t('dashboardHome', 'hello')}, {user.nom.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {t('dashboardHome', 'overview')}
          </p>
        </div>
      </div>

      {/* Carte des alertes IA actives */}
      {alerts.length > 0 && (
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(220, 38, 38, 0.02) 100%)',
          border: '1px solid rgba(220, 62, 62, 0.3)',
          borderLeft: '4px solid #ef4444',
          borderRadius: '12px',
          marginBottom: '32px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                backgroundColor: 'var(--danger)',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
              }}>
                <AlertTriangle size={16} color="#fff" />
              </div>
              <div style={{ fontWeight: 700, color: '#f87171', fontSize: '15px' }}>
                {alerts.length} {t('dashboardHome', 'activeAlerts')}
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/appareils')}
              className="btn-secondary"
              style={{ width: 'auto', padding: '6px 14px', fontSize: '12px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', cursor: 'pointer' }}
            >
              {t('dashboardHome', 'viewAllAlerts')}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '13px', marginBottom: '4px' }}>
                  {alert.title}
                </div>
                <div style={{ color: 'var(--text-subtle)', fontSize: '13px', lineHeight: '1.4' }}>
                  {alert.action}
                </div>
              </div>
            ))}
            {alerts.length > 3 && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4px' }}>
                + {alerts.length - 3} {t('dashboardHome', 'moreAlerts')}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="kpi-grid">
        {/* KPI 1 : Conso */}
        <div className="glass-card glow-card-cyan">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dashboardHome', 'consumptionToday')}</div>
            <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
              <Zap size={16} color="var(--secondary)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>
            {totalConso.toFixed(1)} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>kW</span>
          </div>
          <div style={{ color: 'var(--primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <ArrowUpRight size={14} /> {machines.filter(m => m.status === 'actif').length} {t('dashboardHome', 'activeDevices')} {machines.length}
          </div>
        </div>

        {/* KPI 2 : Économies */}
        <div className="glass-card glow-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dashboardHome', 'savingsMonth')}</div>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <Target size={16} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>
            {economiesMois > 0
              ? (economiesMois >= 1_000_000 ? `${(economiesMois / 1_000_000).toFixed(1)}M` : economiesMois.toLocaleString('fr-FR'))
              : '0'
            } <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>XOF</span>
          </div>
          <div style={{ color: 'var(--primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <ArrowUpRight size={14} /> {t('dashboardHome', 'verifiedSavings')}
          </div>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Graphique */}
        <div className="glass-card" style={{ height: '380px', padding: '28px' }}>
          <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '16px', color: 'var(--foreground)' }}>{t('dashboardHome', 'consumptionEvolution')}</h3>
          <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="consoActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--secondary)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="consoDim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(15,23,42,0.18)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="rgba(15,23,42,0.03)" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'var(--surface-hover)'}}
                  contentStyle={{ backgroundColor: 'var(--background-alt)', borderColor: 'var(--surface-border)', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: 'var(--foreground)', fontSize: '13px' }}
                  labelStyle={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}
                />
                <Bar dataKey="conso" radius={[4, 4, 0, 0]}>
                   {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.conso > (totalConso * 0.8) ? 'url(#consoActive)' : 'url(#consoDim)'} 
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contrôle des Appareils Favoris */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--foreground)' }}>{t('dashboardHome', 'energyHungry')}</h3>
            <span onClick={() => router.push('/dashboard/appareils')} style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer' }}>{t('dashboardHome', 'viewAll').toUpperCase()}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {machines.slice(0, 3).map((appareil) => (
              <div key={appareil.machine_id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px', 
                border: '1px solid var(--surface-border)', 
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.02)',
                transition: 'all 0.2s ease'
              }}
              className="nav-item-hover-only" // Added simple border hover
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: 'var(--foreground)' }}>{appareil.nom}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{appareil.power_kw} kW • {appareil.temperature_c.toFixed(1)}°C</div>
                </div>
                <div 
                  onClick={() => router.push('/dashboard/appareils')}
                  style={{ 
                    cursor: 'pointer', padding: '8px', borderRadius: '50%', 
                    backgroundColor: appareil.status === 'actif' ? 'var(--primary-light)' : 'rgba(239, 68, 68, 0.1)',
                    color: appareil.status === 'actif' ? 'var(--primary)' : '#EF4444',
                    border: appareil.status === 'actif' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Power size={16} />
                </div>
              </div>
            ))}
            {machines.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px' }}>
                Aucune machine enregistrée.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
