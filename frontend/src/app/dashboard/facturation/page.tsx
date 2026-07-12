'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, Cell, PieChart, Pie, ResponsiveContainer } from 'recharts';
import { Download, CheckCircle, Search, FileText } from 'lucide-react';
import { API_URL } from '@/lib/api';

export default function FacturationPage() {
  const [grossSavings, setGrossSavings] = useState(0);
  const [gainShare, setGainShare] = useState(0);
  const [barData, setBarData] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  useEffect(() => {
    const fetchFacturationData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/facturation`);
        const data = await res.json();
        
        if (data) {
          setGrossSavings(data.grossSavings || 0);
          setGainShare(data.gainShare || 0);
          setBarData(data.barData || []);
          setAuditTrail(data.auditTrail || []);
          setInvoices(data.invoices || []);
        }
      } catch (err) {
        console.error("Failed to fetch facturation data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFacturationData();
  }, []);

  const pieData = [
    { name: 'Retained Savings (90%)', value: 90, color: '#10b981' },
    { name: 'Gain-Share Commission (10%)', value: 10, color: '#06b6d4' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>
          <span style={{ color: 'var(--primary)' }}>Entreprise</span> / Facturation & Transparence
        </div>
        <h1 className="text-gradient" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Portail de Transparence Financière</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Audit en temps réel du modèle de partage à 10% (Gain-Share) sur les économies industrielles.
        </p>
      </div>

      <div className="facturation-grid">
        {/* LEFT COLUMN */}
        <div className="facturation-left-col">
          
          {/* Main Savings Card */}
          <div className="glass-card glow-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Économies Totales Vérifiées (Ce Mois)</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Outfit, sans-serif' }}>
                  {grossSavings.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>FCFA</span>
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 700 }}>
                ↗ Dynamique (API)
              </div>
            </div>

            <div style={{ height: '200px', width: '100%', marginBottom: '24px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={1}/>
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="primaryGradDim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <Bar dataKey="savings" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === barData.length - 1 ? 'url(#primaryGrad)' : 'url(#primaryGradDim)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--surface-border)', paddingTop: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Économies Brutes</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{grossSavings.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Gain-Share (10%)</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>{gainShare.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</div>
                </div>
              </div>
              <button onClick={() => showNotification("Génération de l'audit PDF en cours...")} className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', border: 'none', cursor: 'pointer' }}>
                <Download size={16} /> Télécharger l'Audit
              </button>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Journal d'Audit</h3>
                <span style={{ fontSize: '10px', backgroundColor: 'var(--surface-hover)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>0xDF_..A826 AFX</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '12px', fontWeight: 700 }}>
                <CheckCircle size={14} /> REGISTRE INFALSIFIABLE
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>HORODATAGE (UTC)</th>
                  <th>ACTION</th>
                  <th>RÉFÉRENCE HASH</th>
                  <th>STATUT</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((audit, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {audit.timestamp.split('T')[0]}<br/>
                      {audit.timestamp.split('T')[1]}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '14px' }}>{audit.action}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{audit.ref}</td>
                    <td><span className="status-badge status-verified">● {audit.status}</span></td>
                  </tr>
                ))}
                {auditTrail.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Aucun audit récent</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); showNotification("Connexion à l'explorateur de noeuds en cours..."); }} style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none' }}>VOIR LE REGISTRE BLOCKCHAIN COMPLET</a>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="facturation-right-col">
          
          {/* Automated Settlement */}
          <div className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '24px', textTransform: 'uppercase' }}>Règlement Automatisé</h3>
            
            <div style={{ border: '1px solid var(--primary-light)', backgroundColor: 'var(--primary-dim)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '24px', backgroundColor: '#000', borderRadius: '4px' }}></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Wave Merchant</div>
                  <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em' }}>CONNECTÉ</div>
                </div>
              </div>
              <CheckCircle color="var(--primary)" size={20} />
            </div>

            <div style={{ border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '24px', backgroundColor: '#FF6600', borderRadius: '4px' }}></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Orange Money</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>CONFIG. SECOURS</div>
                </div>
              </div>
              <span onClick={() => showNotification("Ouverture des paramètres du portefeuille...")} style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>CHANGER</span>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>PROCHAIN CYCLE DE FACTURATION : 01 OCT 2026</div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--primary)' }}></div>
            </div>
          </div>

          {/* Commission History */}
          <div className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '24px', textTransform: 'uppercase' }}>Historique des Commissions (10%)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {invoices.map((inv) => (
                <div key={inv.id} style={{ border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <FileText color="var(--primary)" size={20} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{inv.id}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{inv.month}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{inv.amount}</div>
                    <div onClick={() => showNotification(`Téléchargement de la facture ${inv.id}...`)} style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>TÉLÉCHARGER</div>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && !loading && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>Aucune facture disponible</div>
              )}
            </div>

            {/* Model Distribution */}
            <div style={{ backgroundColor: 'rgba(230,244,234,0.3)', borderRadius: '8px', padding: '16px', border: '1px solid var(--primary-light)' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px' }}>RÉPARTITION DU MODÈLE</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '60px', height: '60px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={20} outerRadius={30} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                    90%
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>Économies Conservées (90%)</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Commission Gain-Share (10%)</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Custom Toast Notification */}
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
