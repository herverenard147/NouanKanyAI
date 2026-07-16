'use client';

import { useState, useEffect } from 'react';
import { Activity, Server, Cpu, Globe, Zap, Database, CheckCircle, Network, AlertTriangle, Settings2, X, Power, Wrench, FileText, LogIn, Camera } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { authHeaders, getCurrentUser } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';

function formatUptime(seconds: number | null | undefined, t: ReturnType<typeof useLanguage>['t']): string {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return t('admin', 'uptimeSeconds');
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const j = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${j}j ${h}h`;
}

// timestamp backend : datetime.utcnow().isoformat() côté Python, donc une chaîne
// naïve SANS suffixe "Z"/offset (ex. "2026-07-16T09:34:12.949"). new Date() sur une
// telle chaîne la traite comme heure LOCALE du navigateur, pas UTC — même convention
// (et même limite) que appareils/page.tsx:685 ailleurs dans ce portail. Un admin dans
// un fuseau très éloigné d'UTC verrait un décalage ; hors périmètre de cette étape.
function formatRelativeTime(iso: string | null | undefined, lang: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return rtf.format(diffH, 'hour');
  const diffD = Math.round(diffH / 24);
  return rtf.format(diffD, 'day');
}

const ACTIVITY_TYPE_KEYS: Record<string, string> = {
  delestage: 'activityTypeDelestage',
  reset_admin: 'activityTypeResetAdmin',
  ocr_upload: 'activityTypeOcrUpload',
  connexion: 'activityTypeConnexion',
  analyse_media_normal: 'activityTypeAnalyseMediaNormal',
  analyse_media_alerte: 'activityTypeAnalyseMediaAlerte',
};

const ACTIVITY_ICONS: Record<string, any> = {
  delestage: Zap,
  reset_admin: Wrench,
  ocr_upload: FileText,
  connexion: LogIn,
  analyse_media_normal: Camera,
  analyse_media_alerte: Camera,
};

// Libellé construit CÔTÉ FRONTEND à partir du type + clés i18n (cohérent avec
// l'étape 3 et la 5B : le backend ne renvoie que des données structurées brutes).
function getActivityLabel(act: any, t: ReturnType<typeof useLanguage>['t']): string {
  const typeKey = ACTIVITY_TYPE_KEYS[act?.type];
  let label = typeKey ? t('admin', typeKey) : t('admin', 'activityTypeUnknown');
  const source = act?.extras?.analysis_source;
  if ((act?.type === 'analyse_media_normal' || act?.type === 'analyse_media_alerte') && source) {
    const sourceKey = source === 'gemini' ? 'activitySourceGemini' : 'activitySourceFallback';
    label = `${label} (${t('admin', sourceKey)})`;
  }
  return label;
}

export default function AdminDashboardPage() {
  const { t, lang } = useLanguage();
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
        showNotification(`${machineId} ${t('admin', 'resetDone')}`);
        if (managingUser) openManageUser(managingUser);
      }
    } catch (err) {
      showNotification(t('admin', 'resetError'));
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
        showNotification(newRole ? `${u.name} ${t('admin', 'nowAdmin')}` : `${u.name} ${t('admin', 'noLongerAdmin')}`);
        setManagingUser({ ...u, platform_role: newRole });
        fetchAdminMetrics();
      } else {
        showNotification(json.error);
      }
    } catch (err) {
      showNotification(t('admin', 'roleChangeError'));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--primary)' }}>
        {t('admin', 'loadingMetrics')}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', color: 'var(--text-muted)' }}>
        {t('admin', 'loadError')}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>
          <span style={{ color: 'var(--primary)' }}>NouanKanyAI</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>{t('admin', 'title')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {t('admin', 'subtitle')}
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Globe color="var(--primary)" size={24} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '2px 8px', borderRadius: '12px' }}>{t('admin', 'active')}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>{t('admin', 'industrialSites')}</div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{data.platform.total_sites}</div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Zap color="#F59E0B" size={24} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>{t('admin', 'online')}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>{t('admin', 'supervisedMachines')}</div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{data.platform.active_machines} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ {data.platform.total_machines}</span></div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Activity color="#10B981" size={24} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>{t('admin', 'savings')}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>{t('admin', 'globalImpact')}</div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>{data.platform.global_savings_xof.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>FCFA</span></div>
        </div>

        <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--primary)', backgroundColor: 'rgba(15, 114, 68, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Database color="var(--primary)" size={24} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFF', backgroundColor: 'var(--primary)', padding: '2px 8px', borderRadius: '12px' }}>{t('admin', 'revenue')}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>{t('admin', 'mrr')}</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{data.platform.revenue_xof.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span style={{ fontSize: '14px' }}>FCFA</span></div>
        </div>
      </div>

      <div className="grid-2-1">

        {/* Left Column: Users & Activities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* User Directory */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
              👥 {t('admin', 'userDirectory')} ({data.users?.length || 0})
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>{t('admin', 'userCol')}</th>
                    <th>{t('admin', 'roleCol')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin', 'sitesCol')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin', 'machinesCol')}</th>
                    <th>{t('admin', 'lastActivity')}</th>
                    <th>{t('admin', 'statusCol')}</th>
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
                          <Settings2 size={12} /> {t('admin', 'manageUser')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!data.users || data.users.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>{t('admin', 'noUsers')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Activities */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground)' }}>
              ⚡ {t('admin', 'recentActivities')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.recent_activities?.map((act: any, idx: number) => {
                const Icon = ACTIVITY_ICONS[act?.type] || Activity;
                const userLabel = act?.user_name || t('admin', 'deletedUser');
                return (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  border: '1px solid var(--surface-border)',
                  borderRadius: '12px',
                  backgroundColor: 'var(--tint-subtle)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--tint-subtle)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--foreground)' }}>{userLabel}</strong> — {getActivityLabel(act, t)}
                      </div>
                      {act?.ref_id && (
                        <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>🎯 {act.ref_id}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatRelativeTime(act?.timestamp, lang)}</div>
                </div>
                );
              })}
              {(!data.recent_activities || data.recent_activities.length === 0) && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>{t('admin', 'noActivities')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Models Health & System Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* MLOps Summary */}
          <div className="glass-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--primary)" /> {t('admin', 'modelHealth')}
            </h3>

            {(() => {
              const xgb = data.model_metrics?.xgboost;
              const hasMetrics = xgb && xgb.r2 !== null && xgb.r2 !== undefined;
              const datasetLabel = xgb?.dataset === 'synthetic' ? t('admin', 'modelMetricDatasetSynthetic') : xgb?.dataset;
              return (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin', 'modelMetricR2')}</span>
                      <span style={{ fontWeight: 700, color: '#10B981', fontSize: '13px' }}>{hasMetrics ? xgb.r2.toFixed(3) : '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin', 'modelMetricMae')}</span>
                      <span style={{ fontWeight: 700, color: '#F59E0B', fontSize: '13px' }}>{hasMetrics && xgb.mae_kw !== null ? `${xgb.mae_kw.toFixed(2)} kW` : '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin', 'modelMetricMape')}</span>
                      <span style={{ fontWeight: 700, color: '#F59E0B', fontSize: '13px' }}>{hasMetrics && xgb.mape_pct !== null ? `${xgb.mape_pct.toFixed(1)} %` : '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin', 'anomaliesDetected')}</span>
                      <span style={{ fontWeight: 700, color: '#EF4444', fontSize: '13px' }}>{data.ml_health.isolation_forest_anomalies_detected}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {hasMetrics
                      ? `${t('admin', 'modelMetricMeasuredOn')} ${datasetLabel} — ${formatRelativeTime(xgb.computed_at, lang)}`
                      : t('admin', 'modelMetricNotEvaluated')}
                  </div>
                </>
              );
            })()}

            <button onClick={() => showNotification(t('admin', 'retrainSoon'))} className="btn-primary" style={{ padding: '10px 16px', fontSize: '12px', height: 'auto', border: 'none', cursor: 'pointer' }}>
              {t('admin', 'retrainModels')}
            </button>
          </div>

          {/* System Status */}
          <div className="glass-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Server size={16} color="var(--primary)" /> {t('admin', 'systemStatus')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Network size={16} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>{t('admin', 'serverUptime')}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>{formatUptime(data.system.process_uptime_seconds, t)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Database size={16} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>{t('admin', 'dbStatus')}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>{data.system.database_status}</span>
              </div>

              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '8px', marginTop: '4px', display: 'flex', gap: '10px' }}>
                <CheckCircle color="#10B981" size={18} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: '#10B981', marginBottom: '2px' }}>{t('admin', 'systemsOperational')}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {t('admin', 'avgLatency')}: {data.system.avg_latency_ms !== null && data.system.avg_latency_ms !== undefined
                      ? `${data.system.avg_latency_ms}ms (${data.system.sample_count} req.)`
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de gestion utilisateur */}
      {managingUser && (
        <div className="nk-modal-overlay">
          <div className="glass-card nk-modal-content" style={{ maxWidth: '540px', backgroundColor: 'var(--surface-solid)', border: '1px solid var(--surface-border)', padding: '28px', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{t('admin', 'manage')} {managingUser.name}</h2>
              <button onClick={() => setManagingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>{managingUser.email}</p>

            {myRole === 'superadmin' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid var(--surface-border)', borderRadius: '8px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{t('admin', 'platformRole')}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('admin', 'adminHelperText')}</div>
                </div>
                <button
                  onClick={() => toggleAdminRole(managingUser)}
                  className={managingUser.platform_role === 'admin' ? 'btn-secondary' : 'btn-primary'}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', cursor: 'pointer', border: managingUser.platform_role === 'admin' ? '' : 'none' }}
                >
                  {managingUser.platform_role === 'admin' ? t('admin', 'demote') : t('admin', 'promote')}
                </button>
              </div>
            )}

            {managedFacturation && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>{t('admin', 'savingsMonth')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>{managedFacturation.grossSavingsThisMonth.toLocaleString('fr-FR')} FCFA</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>{t('admin', 'cieBills')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>{managedFacturation.billCount}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>{t('admin', 'gainShareInvoices')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>{managedFacturation.invoiceCount}</div>
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>{t('admin', 'equipment')} ({managedMachines.length})</h3>
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
                        <Power size={12} /> {t('admin', 'reset')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {managedMachines.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px', fontSize: '12px' }}>{t('admin', 'noEquipment')}</div>
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
