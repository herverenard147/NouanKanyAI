'use client';

import { useState, useEffect } from 'react';
import { Bot, Sparkles, Zap, ShieldAlert, Loader2, Lightbulb, CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { authHeaders } from '@/lib/auth';

export default function PredictionsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const machinesRes = await fetch(`${API_URL}/api/machines`, { headers: authHeaders() });
        const currentMachinesState = await machinesRes.json();

        const response = await fetch(`${API_URL}/api/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentMachinesState)
        });

        const data = await response.json();
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des recommandations:", error);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 15000);
    return () => clearInterval(interval);
  }, []);

  // Demande à l'assistant flottant (ChatWidget) de traiter cette action, sans dupliquer
  // la logique de chat sur cette page.
  const askAssistant = (rec: any) => {
    window.dispatchEvent(new CustomEvent('nk-open-chat', {
      detail: { message: `Aide-moi à mettre en œuvre cette recommandation : "${rec.action}" (concerne : ${rec.title}).` }
    }));
  };

  const getIconForType = (type: string, severity: string) => {
    if (severity === 'critique') return <ShieldAlert size={20} color="#DC2626" />;
    if (type === 'efficacite') return <Lightbulb size={20} color="#F59E0B" />;
    if (type === 'optimisation') return <Sparkles size={20} color="var(--primary)" />;
    if (type === 'délestage') return <Zap size={20} color="var(--accent)" />;
    return <Bot size={20} color="var(--primary)" />;
  };

  const getColorForSeverity = (severity: string) => {
    if (severity === 'critique') return '#DC2626';
    if (severity === 'modérée') return 'var(--accent)';
    return 'var(--primary)';
  };

  const alerts = recommendations.filter(r => r.type === 'alerte');
  const tips = recommendations.filter(r => r.type !== 'alerte');

  const renderCard = (rec: any, idx: number) => {
    const color = getColorForSeverity(rec.severity);
    return (
      <div key={idx} className="glass-card" style={{ borderLeft: `4px solid ${color}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div>{getIconForType(rec.type, rec.severity)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{rec.title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
              {rec.description}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
              {rec.gain_fcfa > 0 ? (
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>GAIN ESTIMÉ : {rec.gain_fcfa.toLocaleString('fr-FR')} XOF</div>
              ) : rec.type === 'alerte' ? (
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>ACTION CRITIQUE — INTERVENTION HUMAINE REQUISE</div>
              ) : null}

              {rec.auto_resolu ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', padding: '8px 14px', borderRadius: '20px', backgroundColor: 'var(--primary-dim)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <CheckCircle2 size={14} /> Résolu automatiquement par l'IA
                </div>
              ) : (
                <button
                  onClick={() => askAssistant(rec)}
                  className={rec.severity === 'critique' ? "btn-secondary" : "btn-primary"}
                  style={{ width: '100%', padding: '8px 14px', fontSize: '12px', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.4, borderColor: rec.severity === 'critique' ? '#DC2626' : '', color: rec.severity === 'critique' ? '#DC2626' : '', cursor: 'pointer' }}>
                  {rec.action}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>
          <span style={{ color: 'var(--primary)' }}>Assistant IA</span> / Recommandations & Conseils
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>Optimisez votre consommation</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          L'IA analyse vos équipements en continu (XGBoost, Isolation Forest et notre catalogue d'équipements) pour vous
          alerter sur les urgences et vous conseiller sur des actions concrètes — y compris remplacer un appareil par un
          modèle équivalent mais plus économe. Pour discuter avec l'assistant, utilisez la bulle de chat en bas à droite.
        </p>
      </div>

      {alerts.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="#DC2626" /> ALERTES — INTERVENTION HUMAINE REQUISE ({alerts.length})
            {loadingRecs && <Loader2 size={16} className="animate-spin text-primary" />}
          </h3>
          <div className="grid-2-equal">
            {alerts.map((rec, idx) => renderCard(rec, idx))}
          </div>
        </div>
      )}

      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={16} color="#F59E0B" /> CONSEILS & OPTIMISATIONS ({tips.length})
          {loadingRecs && <Loader2 size={16} className="animate-spin text-primary" />}
        </h3>

        {!loadingRecs && tips.length === 0 && alerts.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            Aucune recommandation pour le moment. Votre installation est optimale !
          </div>
        ) : (
          <div className="grid-2-equal">
            {tips.map((rec, idx) => renderCard(rec, idx))}
          </div>
        )}
      </div>
    </div>
  );
}
