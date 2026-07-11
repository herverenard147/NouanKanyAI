'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Zap, Target, Power, AlertTriangle, Bot } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // États pour les appareils venant de l'API
  const [machines, setMachines] = useState<any[]>([]);
  const [totalConso, setTotalConso] = useState(0);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  const data = [
    { time: '00:00', conso: 1.2 },
    { time: '06:00', conso: 1.8 },
    { time: '12:00', conso: 5.1 },
    { time: '18:00', conso: 4.8 },
    { time: '23:59', conso: 2.1 },
  ];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUser({
          nom: session.user.user_metadata?.nom || session.user.email,
          email: session.user.email
        });
      } else {
        router.push('/');
      }
    };
    checkUser();
    
    // Fetch live machines state
    const fetchMachines = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/machines');
        const data = await res.json();
        setMachines(data);
        
        // Calculate total consumption
        const total = data.reduce((acc: number, m: any) => acc + (m.status === 'actif' ? m.power_kw : 0), 0);
        setTotalConso(total);

        // Fetch AI recommendation
        if (data.length > 0) {
          const recRes = await fetch('http://localhost:8000/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: data })
          });
          const recData = await recRes.json();
          if (recData.recommendations && recData.recommendations.length > 0) {
            setAiSuggestion(recData.recommendations[0]);
          } else {
            setAiSuggestion(null);
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

  const toggleAppareil = (machine_id: string) => {
    // In a real app, this would call an API to toggle the machine
    console.log("Toggle", machine_id);
  };

  if (!user) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>
            Bonjour, {user.nom.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Voici la vue d'ensemble de votre infrastructure énergétique.
          </p>
        </div>
      </div>

      {/* Alerte IA */}
      {aiSuggestion && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', backgroundColor: aiSuggestion.type.includes('Surchauffe') ? 'rgba(220, 38, 38, 0.1)' : 'rgba(255, 214, 0, 0.1)', border: `1px solid ${aiSuggestion.type.includes('Surchauffe') ? '#DC2626' : 'var(--accent)'}`, borderRadius: '8px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: aiSuggestion.type.includes('Surchauffe') ? '#DC2626' : 'var(--accent)', padding: '8px', borderRadius: '50%' }}>
            {aiSuggestion.type.includes('Surchauffe') ? <AlertTriangle size={20} color="#fff" /> : <Bot size={20} color="#fff" />}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: aiSuggestion.type.includes('Surchauffe') ? '#DC2626' : '#B79A00', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {aiSuggestion.type} sur {aiSuggestion.machine_id}
            </div>
            <div style={{ color: 'var(--foreground)', fontSize: '14px' }}>
              {aiSuggestion.action}
            </div>
          </div>
        </div>
      )}

      <div className="kpi-grid">
        {/* KPI 1 : Conso */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Consommation (Aujourd'hui)</div>
            <div style={{ backgroundColor: 'var(--surface-hover)', padding: '8px', borderRadius: '8px' }}>
              <Zap size={18} color="var(--secondary)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'Inter, sans-serif', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>
            {totalConso.toFixed(1)} <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>kW</span>
          </div>
          <div style={{ color: 'var(--primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <ArrowUpRight size={14} /> -12% depuis hier
          </div>
        </div>

        {/* KPI 2 : Économies */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Économies Générées (Mois)</div>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '8px', borderRadius: '8px' }}>
              <Target size={18} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontFamily: 'Inter, sans-serif', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>
            14.2M <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>XOF</span>
          </div>
          <div style={{ color: 'var(--primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <ArrowUpRight size={14} /> +12.4% d'optimisation IA
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Graphique */}
        <div className="glass-card" style={{ height: '350px', padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '16px' }}>Évolution de la consommation</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'var(--surface-hover)'}}
                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Bar dataKey="conso" fill="var(--secondary)" radius={[4, 4, 0, 0]}>
                 {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.conso > 4 ? 'var(--secondary)' : '#B3E5FC'} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Contrôle des Appareils Favoris */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '16px' }}>Appareils Énergivores</h3>
            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>VOIR TOUT</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {machines.map((appareil) => (
              <div key={appareil.machine_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{appareil.nom}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{appareil.power_kw} kW • {appareil.temperature_c}°C</div>
                </div>
                <div 
                  onClick={() => toggleAppareil(appareil.machine_id)}
                  style={{ 
                    cursor: 'pointer', padding: '8px', borderRadius: '50%', 
                    backgroundColor: appareil.status === 'actif' ? 'var(--primary-light)' : '#FEE2E2',
                    color: appareil.status === 'actif' ? 'var(--primary)' : '#EF4444',
                    transition: 'all 0.2s'
                  }}
                >
                  <Power size={18} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
