'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, Cell, PieChart, Pie, ResponsiveContainer } from 'recharts';
import { Download, CheckCircle, Search, FileText, Camera, Sparkles, Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { authHeaders } from '@/lib/auth';

export default function FacturationPage() {
  const [grossSavings, setGrossSavings] = useState(0);
  const [gainShare, setGainShare] = useState(0);
  const [barData, setBarData] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  // Factures d'électricité réelles du client (photo/manuel/prévision IA)
  const [bills, setBills] = useState<any[]>([]);
  const [uploadingBill, setUploadingBill] = useState(false);
  const [generatingForecast, setGeneratingForecast] = useState(false);
  const [actualInputs, setActualInputs] = useState<Record<string, string>>({});
  const [confirmingBillId, setConfirmingBillId] = useState<string | null>(null);
  const [manualBillMode, setManualBillMode] = useState(false);
  const [manualMonth, setManualMonth] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBills = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bills`, { headers: authHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setBills(data);
    } catch (err) {
      console.error("Failed to fetch bills:", err);
    }
  };

  const handleUploadBillPhoto = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBill(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/bills/upload-photo`, {
        method: 'POST', headers: authHeaders(), body: formData
      });
      const data = await res.json();
      if (data.error) {
        showNotification(data.error);
      } else {
        showNotification(`Facture de ${data.bill.month} importée avec succès.`);
        fetchBills();
      }
    } catch (err) {
      showNotification("Erreur lors de l'analyse de la facture.");
    } finally {
      setUploadingBill(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateForecast = async () => {
    setGeneratingForecast(true);
    try {
      const res = await fetch(`${API_URL}/api/bills/forecast`, {
        method: 'POST', headers: authHeaders()
      });
      const data = await res.json();
      if (data.error) {
        showNotification(data.error);
      } else {
        showNotification(`Prévision générée pour ${data.month}.`);
        fetchBills();
      }
    } catch (err) {
      showNotification("Erreur lors de la génération de la prévision.");
    } finally {
      setGeneratingForecast(false);
    }
  };

  const handleConfirmActual = async (billId: string) => {
    const value = parseFloat(actualInputs[billId]);
    if (!value || value <= 0) return;
    try {
      const res = await fetch(`${API_URL}/api/bills/${billId}/actual`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ actual_amount_xof: value })
      });
      const data = await res.json();
      if (!data.error) {
        showNotification("Montant réel enregistré — l'IA recalibre ses prochaines prévisions.");
        setConfirmingBillId(null);
        fetchBills();
      }
    } catch (err) {
      showNotification("Erreur lors de l'enregistrement.");
    }
  };

  const handleAddManualBill = async () => {
    if (!manualMonth || !manualAmount) return;
    try {
      const res = await fetch(`${API_URL}/api/bills/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ month: manualMonth, amount_xof: parseFloat(manualAmount) })
      });
      const data = await res.json();
      if (!data.error) {
        showNotification("Facture ajoutée à l'historique.");
        setManualMonth(''); setManualAmount(''); setManualBillMode(false);
        fetchBills();
      }
    } catch (err) {
      showNotification("Erreur lors de l'ajout.");
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadAudit = () => {
    const lines = [
      'NouanKanyAI — Rapport d\'Audit des Économies',
      `Généré le : ${new Date().toLocaleString('fr-FR')}`,
      '',
      `Économies Totales Vérifiées (Ce Mois) : ${grossSavings.toLocaleString('fr-FR')} FCFA`,
      `Gain-Share (10%) : ${gainShare.toLocaleString('fr-FR')} FCFA`,
      '',
      'JOURNAL D\'AUDIT',
      'Horodatage | Action | Référence | Statut',
      ...(auditTrail.length > 0
        ? auditTrail.map(a => `${a.timestamp} | ${a.action} | ${a.ref} | ${a.status}`)
        : ['(aucun audit enregistré pour le moment)']),
    ];
    downloadTextFile(`audit-nouankanyai-${Date.now()}.txt`, lines.join('\n'));
    showNotification("Rapport d'audit téléchargé.");
  };

  const downloadInvoice = (inv: any) => {
    const lines = [
      'NouanKanyAI — Facture Gain-Share',
      `Facture : ${inv.id}`,
      `Période : ${inv.month}`,
      `Montant : ${inv.amount}`,
      `Généré le : ${new Date().toLocaleString('fr-FR')}`,
    ];
    downloadTextFile(`facture-${inv.id}.txt`, lines.join('\n'));
    showNotification(`Facture ${inv.id} téléchargée.`);
  };

  useEffect(() => {
    const fetchFacturationData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/facturation`, { headers: authHeaders() });
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
    fetchBills();
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
              <button onClick={downloadAudit} className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', border: 'none', cursor: 'pointer' }}>
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
              <a href="#" onClick={(e) => { e.preventDefault(); showNotification("Le registre complet n'est pas encore disponible — bientôt ici."); }} style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none' }}>VOIR LE REGISTRE BLOCKCHAIN COMPLET</a>
            </div>
          </div>

          {/* Factures d'électricité réelles + prévisions IA */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Factures & Prévisions IA</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              Importez vos vraies factures d'électricité (photo ou saisie manuelle) pour que l'IA base ses prévisions
              et ses optimisations sur votre historique réel. Quand le mois prévu arrive, entrez le montant réel pour
              que l'IA affine sa précision.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleUploadBillPhoto} style={{ display: 'none' }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                disabled={uploadingBill}
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', border: 'none', cursor: 'pointer' }}>
                {uploadingBill ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                {uploadingBill ? 'Analyse en cours...' : 'Prendre en photo / Importer une facture'}
              </button>
              <button
                onClick={handleGenerateForecast}
                className="btn-secondary"
                disabled={generatingForecast}
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', cursor: 'pointer' }}>
                {generatingForecast ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Générer la prévision du mois prochain
              </button>
            </div>

            {!manualBillMode ? (
              <div style={{ marginBottom: '16px' }}>
                <span onClick={() => setManualBillMode(true)} style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer' }}>
                  Ou saisir une ancienne facture manuellement
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px', padding: '14px', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                <input className="input-field" placeholder="Ex: Juin 2026" value={manualMonth} onChange={(e) => setManualMonth(e.target.value)} style={{ width: '140px' }} />
                <input className="input-field" type="number" placeholder="Montant (FCFA)" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} style={{ width: '160px' }} />
                <button onClick={handleAddManualBill} className="btn-primary" style={{ width: 'auto', padding: '8px 16px', border: 'none', cursor: 'pointer' }}>Ajouter</button>
                <span onClick={() => setManualBillMode(false)} style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>Annuler</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bills.map((bill) => {
                const sourceBadge = bill.is_forecast
                  ? { label: 'PRÉVISION IA', color: '#F59E0B' }
                  : bill.source === 'ocr'
                  ? { label: 'PHOTO', color: 'var(--primary)' }
                  : { label: 'MANUEL', color: 'var(--text-muted)' };
                const needsActual = bill.is_forecast && !bill.actual_amount_xof;
                const ecartPct = bill.is_forecast && bill.actual_amount_xof && bill.amount_xof
                  ? Math.round(((bill.actual_amount_xof - bill.amount_xof) / bill.amount_xof) * 100)
                  : null;
                return (
                  <div key={bill.id} style={{ border: `1px solid ${needsActual ? 'rgba(245,158,11,0.35)' : 'var(--surface-border)'}`, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: sourceBadge.color, border: `1px solid ${sourceBadge.color}55`, padding: '2px 8px', borderRadius: '4px' }}>{sourceBadge.label}</span>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{bill.month}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>
                        {bill.is_forecast ? `~${bill.amount}` : bill.amount}
                      </div>
                    </div>

                    {ecartPct !== null && (
                      <div style={{ fontSize: '11px', color: Math.abs(ecartPct) <= 10 ? 'var(--primary)' : '#F59E0B', fontWeight: 600 }}>
                        Réel : {bill.actual_amount_xof.toLocaleString('fr-FR')} FCFA (écart {ecartPct > 0 ? '+' : ''}{ecartPct}% vs. prévision)
                      </div>
                    )}

                    {needsActual && (
                      confirmingBillId === bill.id ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            className="input-field" type="number" placeholder="Montant réel (FCFA)"
                            value={actualInputs[bill.id] || ''}
                            onChange={(e) => setActualInputs({ ...actualInputs, [bill.id]: e.target.value })}
                            style={{ width: '160px', padding: '6px 10px', fontSize: '12px' }}
                          />
                          <button onClick={() => handleConfirmActual(bill.id)} className="btn-primary" style={{ width: 'auto', padding: '6px 14px', fontSize: '12px', border: 'none', cursor: 'pointer' }}>Valider</button>
                          <span onClick={() => setConfirmingBillId(null)} style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>Annuler</span>
                        </div>
                      ) : (
                        <span onClick={() => setConfirmingBillId(bill.id)} style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                          La facture réelle est arrivée — entrer le montant réel
                        </span>
                      )
                    )}
                  </div>
                );
              })}
              {bills.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '13px' }}>
                  Aucune facture pour le moment. Importez votre première facture pour démarrer les prévisions IA.
                </div>
              )}
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
              <span onClick={() => showNotification("Gestion des méthodes de paiement bientôt disponible.")} style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>CHANGER</span>
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
                    <div onClick={() => downloadInvoice(inv)} style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>TÉLÉCHARGER</div>
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
