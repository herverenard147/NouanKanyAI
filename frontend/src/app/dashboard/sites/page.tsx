'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Factory, MapPin, Activity, AlertCircle, X } from 'lucide-react';
import { getCurrentUser, authHeaders } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';

export default function SitesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [sites, setSites] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchSites = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);

        // Récupérer les sites de l'utilisateur
        const sitesRes = await fetch(`${API_URL}/api/sites`, { headers: authHeaders() });
        const sitesData = sitesRes.ok ? await sitesRes.json() : [];

        // Récupérer toutes les machines
        const machinesRes = await fetch(`${API_URL}/api/machines`, { headers: authHeaders() });
        const machinesData = machinesRes.ok ? await machinesRes.json() : [];

        const formattedSites = sitesData.map((s: any) => {
          // Filtrer les machines appartenant à ce site
          const siteMachines = machinesData.filter((m: any) => m.site_id === s.id);
          const activeMachines = siteMachines.filter((m: any) => m.status === 'actif');
          const totalPower = activeMachines.reduce((sum: number, m: any) => sum + parseFloat(m.power_kw || 0), 0);
          const alertsCount = siteMachines.filter((m: any) => m.status === 'alerte').length;

          return {
            id: s.id,
            name: s.nom,
            location: s.localisation,
            status: alertsCount > 0 ? 'alerte' : 'optimal',
            power: `${totalPower.toFixed(1)} kW`,
            devices: siteMachines.length,
            alerts: alertsCount
          };
        });
        setSites(formattedSites);
      }
    };
    fetchSites();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName || !newSiteLocation || !user) return;
    
    try {
      const res = await fetch(`${API_URL}/api/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          nom: newSiteName,
          localisation: newSiteLocation
        })
      });
      const data = await res.json();

      if (res.ok && data && !data.error) {
        const newSite = {
          id: data.id,
          name: data.nom,
          location: data.localisation,
          status: 'optimal',
          power: '0.0 kW',
          devices: 0,
          alerts: 0
        };
        setSites([...sites, newSite]);
      } else {
        console.error("Failed to add site:", data.error || data);
      }
    } catch (err) {
      console.error("Failed to add site:", err);
    }
    
    setNewSiteName('');
    setNewSiteLocation('');
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="page-header-row" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>
            <span style={{ color: 'var(--primary)' }}>{t('nav', 'sites')}</span> / {t('sites', 'breadcrumb')}
          </div>
          <h1 className="text-gradient" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>{t('sites', 'title')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {t('sites', 'subtitle')}
          </p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setIsModalOpen(true)}>
          {t('sites', 'addSiteBtn')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sites.map(site => (
          <div key={site.id} className="glass-card glow-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ 
                backgroundColor: 'var(--primary-light)', 
                padding: '16px', borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                <Factory size={28} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: 'var(--foreground)' }}>{site.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <MapPin size={14} /> {site.location}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>{t('sites', 'currentLoad')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
                  <Activity size={18} color="var(--secondary)" /> {site.power}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>{t('sites', 'connectedDevices')}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>{site.devices}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>{t('sites', 'aiStatus')}</div>
                {site.alerts > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: 700, fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '4px 12px', borderRadius: '20px' }}>
                    <AlertCircle size={14} /> {site.alerts} {t('sites', 'alertsCount')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', backgroundColor: 'var(--primary-dim)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 12px', borderRadius: '20px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span> {t('sites', 'optimal')}
                  </div>
                )}
              </div>

              <button
                className="btn-secondary"
                style={{ width: 'auto' }}
                onClick={() => router.push(`/dashboard/appareils?siteId=${site.id}`)}
              >
                {t('sites', 'manageSite')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'ajout de site */}
      {isModalOpen && (
        <div className="nk-modal-overlay">
          <div className="glass-card nk-modal-content" style={{ maxWidth: '420px', backgroundColor: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{t('sites', 'addSite')}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSite}>
              <div className="input-group">
                <label className="input-label">{t('sites', 'siteName')}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Usine Sud"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">{t('sites', 'location')}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Koumassi"
                  value={newSiteLocation}
                  onChange={(e) => setNewSiteLocation(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('common', 'cancel')}</button>
                <button type="submit" className="btn-primary">{t('common', 'add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
