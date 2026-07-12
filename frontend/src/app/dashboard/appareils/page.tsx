'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Activity, AlertTriangle, ShieldCheck, Zap, RotateCcw, ActivitySquare, AlertOctagon } from 'lucide-react';
import { API_URL } from '@/lib/api';

export default function AppareilsPage() {
  const router = useRouter();
  const [appareils, setAppareils] = useState<any[]>([]);
  const [totalPower, setTotalPower] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };
  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMachines = async () => {
    try {
      const res = await fetch(`${API_URL}/api/machines`);
      const data = await res.json();
      
      const mapped = data.map((m: any) => ({
        id: m.machine_id,
        nom: m.nom,
        status: m.status,
        power: m.status === 'actif' ? `${m.power_kw} kW` : 'N/A',
        power_raw: m.power_kw,
        metric1Label: 'Température', 
        metric1Value: `${m.temperature_c.toFixed(1)}°C`, 
        metric1Color: m.temperature_c > 60 ? '#DC2626' : 'var(--foreground)',
        metric2Label: 'Vibrations', 
        metric2Value: `${m.vibration_hz.toFixed(1)} Hz`, 
        metric2Progress: m.vibration_hz > 20 ? 100 : (m.vibration_hz / 20) * 100, 
        metric2Color: m.vibration_hz > 20 ? '#DC2626' : 'var(--primary)',
        alertType: m.status === 'alerte' ? 'Intervention Requise' : '',
        icon: m.status === 'alerte' ? <AlertOctagon size={24} color="#DC2626" /> : <ActivitySquare size={24} color="var(--primary)" />
      }));
      setAppareils(mapped);
      
      const total = mapped.reduce((acc: number, curr: any) => acc + (curr.status === 'actif' ? curr.power_raw : 0), 0);
      setTotalPower(total);
    } catch (err) {
      console.error(err);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pour la simulation d'alerte (déclenche une alerte sur une machine aléatoire/la première)
  const triggerFakeAlert = async () => {
    try {
      if (appareils.length === 0) {
        showToast("Ajoutez d'abord une machine avant de simuler une alerte.");
        return;
      }
      // On prend la première machine saine
      const target = appareils.find(a => a.status === 'actif') || appareils[0];
      await fetch(`${API_URL}/api/machines/${target.id}/simulate`, { method: 'POST' });
      fetchMachines();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>Équipements Enregistrés</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Surveillance en temps réel et diagnostics IA sur <strong>{appareils.length} équipements actifs</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', borderColor: '#FCA5A5' }} onClick={triggerFakeAlert}>
            <AlertTriangle size={18} /> Simuler Capteur (Alerte)
          </button>
          <button className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Ajouter un Équipement
          </button>
        </div>
      </div>

      {/* 4 KPIs Top Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>PUISSANCE TOTALE</div>
            <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>Actuel</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{totalPower.toFixed(1)} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>kW</span></div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>SANTÉ IA MOYENNE</div>
            <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>Optimal <ShieldCheck size={12} /></div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>94.8 <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>%</span></div>
        </div>

        <div className="glass-card" style={{ padding: '20px', border: '1px solid #DC2626', borderLeft: '4px solid #DC2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>ALERTES ACTIVES</div>
            <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700 }}>Critique ⚠</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#DC2626' }}>{appareils.filter(a => a.status === 'alerte').length < 10 ? `0${appareils.filter(a => a.status === 'alerte').length}` : appareils.filter(a => a.status === 'alerte').length} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Noeuds</span></div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>OPTIMISATION</div>
            <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>Active ⚡</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>12.5 <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>x</span></div>
        </div>
      </div>

      {/* Equipment Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {appareils.map((app) => (
          <div key={app.id} className="glass-card" style={{ 
            padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            borderTop: `4px solid ${app.status === 'actif' ? 'var(--primary)' : app.status === 'alerte' ? 'var(--danger)' : 'var(--surface-border)'}`,
            backgroundColor: app.status === 'alerte' ? 'rgba(239, 68, 68, 0.05)' : app.status === 'hors ligne' ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
            borderColor: app.status === 'alerte' ? 'rgba(239, 68, 68, 0.2)' : 'var(--surface-border)'
          }}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: app.status === 'actif' ? 'var(--primary)' : app.status === 'alerte' ? 'var(--danger)' : 'var(--text-muted)' }}></div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: app.status === 'alerte' ? 'var(--danger)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {app.status}
                    </div>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--foreground)' }}>{app.nom}</h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>ID Actif: #{app.id}</div>
                </div>
                <div>{app.icon}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{app.status === 'hors ligne' ? 'Dernière Activité' : app.status === 'alerte' ? app.metric1Label : 'Puissance Nominale'}</span>
                  <span style={{ fontWeight: 600, color: app.status === 'alerte' ? '#f87171' : app.metric1Color }}>{app.status === 'actif' ? app.power : app.metric1Value}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{app.status === 'hors ligne' ? 'Cycle de Maintenance' : app.status === 'alerte' ? 'Optimisation IA' : app.metric1Label}</span>
                  <span style={{ fontWeight: 600, color: app.status === 'alerte' ? 'var(--danger)' : app.status === 'hors ligne' ? 'var(--primary)' : app.metric1Color }}>
                    {app.status === 'alerte' ? app.alertType : app.status === 'hors ligne' ? app.offlineStatus : app.metric1Value}
                  </span>
                </div>
                
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <span>{app.metric2Label}</span>
                    <span style={{ color: app.metric2Color }}>{app.metric2Value}</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--surface-border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${app.metric2Progress}%`, height: '100%', backgroundColor: app.metric2Color }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', padding: '16px', borderTop: `1px solid ${app.status === 'alerte' ? 'rgba(239, 68, 68, 0.2)' : 'var(--surface-border)'}`, backgroundColor: 'transparent' }}>
              {app.status === 'alerte' ? (
                <button onClick={() => router.push('/dashboard/predictions')} className="btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', border: 'none', cursor: 'pointer' }}>
                  <AlertTriangle size={16} /> Lancer Diagnostic d'Urgence
                </button>
              ) : app.status === 'hors ligne' ? (
                <button className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={16} /> Réveiller le Système
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} /> Diagnostics
                  </button>
                  <button className="btn-secondary" style={{ width: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'ajout d'appareil */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '400px', backgroundColor: 'var(--surface)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Ajouter un Équipement</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✖
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('nom') as string;
              const power = formData.get('puissance') as string;
              const quantity = formData.get('quantite') as string;
              if(!name || !power || !quantity) return;

              try {
                await fetch(`${API_URL}/api/machines`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nom: name, power_kw: parseFloat(power), quantite: parseInt(quantity) })
                });
                setIsModalOpen(false);
                fetchMachines(); // Refresh immediately
              } catch (err) {
                console.error("Erreur d'ajout", err);
              }
            }}>
              <div className="input-group">
                <label className="input-label">Nom de l'équipement</label>
                <input type="text" name="nom" className="input-field" placeholder="Ex: Turbine-Beta-02" required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Puissance (kW)</label>
                  <input type="number" name="puissance" className="input-field" placeholder="Ex: 150" min="0.1" step="0.1" required />
                </div>
                <div className="input-group">
                  <label className="input-label">Quantité</label>
                  <input type="number" name="quantite" className="input-field" defaultValue="1" min="1" required />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Beautiful Toast Notification */}
      {toastMessage && (
        <div style={{ 
          position: 'fixed', 
          bottom: '32px', 
          right: '32px', 
          backgroundColor: '#ef4444', 
          color: '#fff', 
          padding: '16px 24px', 
          borderRadius: '12px', 
          fontWeight: 600, 
          zIndex: 99999, 
          boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'fadeInUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <span style={{ fontSize: '18px' }}>⚠</span>
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
