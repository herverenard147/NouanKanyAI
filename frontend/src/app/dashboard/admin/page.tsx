'use client';

import { useState, useEffect } from 'react';
import { Activity, Server, ShieldAlert, Cpu, Globe, Zap, Database, CheckCircle, Network, AlertTriangle, Settings2, X, Power } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API_URL } from '@/lib/api';
import { authHeaders, getCurrentUser } from '@/lib/auth';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [myRole, setMyRole] = useState<string | null>(null);
  const [managingUser, setManagingUser] = useState<any>(null);
  const [managedMachines, setManagedMachines] = useState<any[]>([]);
  const [managedFacturation, setManagedFacturation] = useState<any>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const fetchAdminMetrics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/metrics`, { headers: authHeaders() });
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

  useEffect(() => {
    fetchAdminMetrics();
    getCurrentUser().then(u => setMyRole(u?.platform_role || null));
  }, []);

  const openManageUser = async (u: any) => {
    setManagingUser(u);
    setManagedMachines([]);
    setManagedFacturation(null);
    try {
      const [machinesRes, factRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users/${u.id}/machines`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/admin/users/${u.id}/facturation`, { headers: authHeaders() }),
      ]);
      setManagedMachines(await machinesRes.json());
      setManagedFacturation(await factRes.json());
    } catch (err) {
      console.error("Failed to fetch user detail", err);
    }
  };

  const adminResetMachine = async (machineId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/machines/${machineId}/reset`, {
        method: 'POST', headers: authHeaders()
      });
      const json = await res.json();
      if (!json.error) {
        showNotification(`${machineId} réinitialisé.`);
        if (managingUser) openManageUser(managingUser);
      }
    } catch (err) {
      showNotification("Erreur lors de la réinitialisation.");
    }
  };

  const toggleAdminRole = async (u: any) => {
    const newRole = u.platform_role === 'admin' ? null : 'admin';
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${u.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ platform_role: newRole })
      });
      const json = await res.json();
      if (!json.error) {
        showNotification(newRole ? `${u.name} est maintenant administrateur.` : `${u.name} n'est plus administrateur.`);
        setManagingUser({ ...u, platform_role: newRole });
        fetchAdminMetrics();
      } else {
        showNotification(json.error);
      }
    } catch (err) {
      showNotification("Erreur lors du changement de rôle.");
    }
  };

  // Génère dynamiquement les données de dérive du modèle à partir de la précision réelle retournée par l'API
  const generateDriftData = (baseMape: number) => {
    const hours = ['00h', '04h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
    return hours.map(h => ({
      time: h,
      error: parseFloat((baseMape * (0.85 + Math.random() * 0.35)).toFixed(2))
    }));
  };

  const driftData = data
    ? generateDriftData(data.ml_health.xgboost_mape)
    : [];

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
          <span style={{ color: 'var(--primary)' }}>NouanKanyAI</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>Centre de Contrôle Global</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Supervision globale de l'infrastructure, gestion des comptes et statistiques d'activité des utilisateurs.
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

      <div className="grid-2-1">

        {/* Left Column: Users & Activities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* User Directory */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
              👥 Annuaire des Utilisateurs ({data.users?.length || 0})
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th style={{ textAlign: 'center' }}>Sites</th>
                    <th style={{ textAlign: 'center' }}>Machines</th>
                    <th>Dernière Activité</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.users?.map((u: any, idx: number) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '14px' }}>{u.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                          {u.role}
                        </span>
                        {u.platform_role && (
                          <span style={{ marginLeft: '6px', fontSize: '10px', color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>
                            {u.platform_role === 'superadmin' ? 'SUPERADMIN' : 'ADMIN'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{u.sites_count}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{u.machines_count}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.last_active}</td>
                      <td>
                        <span className={`status-badge ${u.status === 'actif' ? 'status-verified' : 'status-backup'}`}>
                          ● {u.status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => openManageUser(u)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <Settings2 size={12} /> Gérer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!data.users || data.users.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Aucun utilisateur enregistré.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Activities */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
              ⚡ Activités Récentes des Utilisateurs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.recent_activities?.map((act: any, idx: number) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  border: '1px solid var(--surface-border)',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                      {act.user_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--foreground)' }}>{act.user_name}</strong> : {act.action}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>🎯 {act.target}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{act.timestamp}</div>
                </div>
              ))}
              {(!data.recent_activities || data.recent_activities.length === 0) && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>Aucune activité récente.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Models Health & System Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* MLOps Summary */}
          <div className="glass-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--primary)" /> Santé des Modèles Prédictifs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>PRÉCISION XGBOOST</span>
                <span style={{ fontWeight: 700, color: '#10B981', fontSize: '13px' }}>{data.ml_health.xgboost_accuracy}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TAUX D'ERREUR (MAPE)</span>
                <span style={{ fontWeight: 700, color: '#F59E0B', fontSize: '13px' }}>{data.ml_health.xgboost_mape}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ANOMALIES DÉTECTÉES</span>
                <span style={{ fontWeight: 700, color: '#EF4444', fontSize: '13px' }}>{data.ml_health.isolation_forest_anomalies_detected}</span>
              </div>
            </div>

            <button onClick={() => showNotification("Le ré-entraînement à la demande depuis l'interface n'est pas encore disponible.")} className="btn-primary" style={{ padding: '10px 16px', fontSize: '12px', height: 'auto', border: 'none', cursor: 'pointer' }}>
              Réentraîner les modèles
            </button>
          </div>

          {/* System Status */}
          <div className="glass-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Server size={16} color="var(--primary)" /> État du Système
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Network size={16} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>Disponibilité API</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>{data.system.api_uptime}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Database size={16} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>Base de Données</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>{data.system.database_status}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={16} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>Registre d'Audit</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>{data.system.blockchain_ledger}</span>
              </div>

              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '8px', marginTop: '4px', display: 'flex', gap: '10px' }}>
                <CheckCircle color="#10B981" size={18} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: '#10B981', marginBottom: '2px' }}>Systèmes Opérationnels</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latence API: {data.system.avg_latency_ms}ms.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de gestion utilisateur */}
      {managingUser && (
        <div className="nk-modal-overlay">
          <div className="glass-card nk-modal-content" style={{ maxWidth: '540px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Gérer {managingUser.name}</h2>
              <button onClick={() => setManagingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>{managingUser.email}</p>

            {myRole === 'superadmin' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid var(--surface-border)', borderRadius: '8px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Rôle plateforme</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Un administrateur peut assister les clients mais ne peut pas gérer les rôles.</div>
                </div>
                <button
                  onClick={() => toggleAdminRole(managingUser)}
                  className={managingUser.platform_role === 'admin' ? 'btn-secondary' : 'btn-primary'}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', cursor: 'pointer', border: managingUser.platform_role === 'admin' ? '' : 'none' }}
                >
                  {managingUser.platform_role === 'admin' ? 'Rétrograder' : 'Promouvoir en Admin'}
                </button>
              </div>
            )}

            {managedFacturation && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>ÉCONOMIES (MOIS)</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>{managedFacturation.grossSavingsThisMonth.toLocaleString('fr-FR')} FCFA</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>FACTURES CIE</div>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>{managedFacturation.billCount}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>FACTURES GAIN-SHARE</div>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>{managedFacturation.invoiceCount}</div>
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>ÉQUIPEMENTS ({managedMachines.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
              {managedMachines.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{m.nom}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.site_nom} · {m.puissance_nominale_kw} kW</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`status-badge ${m.status === 'actif' ? 'status-verified' : 'status-backup'}`}>● {m.status}</span>
                    {m.status === 'alerte' && (
                      <button onClick={() => adminResetMachine(m.machine_id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <Power size={12} /> Réinitialiser
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {managedMachines.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px', fontSize: '12px' }}>Aucun équipement enregistré pour cet utilisateur.</div>
              )}
            </div>
          </div>
        </div>
      )}

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
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
