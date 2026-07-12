'use client';

import { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, Zap, ShieldAlert, Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { authHeaders, getCurrentUser } from '@/lib/auth';

export default function PredictionsPage() {
  const [inputMessage, setInputMessage] = useState('');
  const defaultMessage = { sender: 'ai', text: 'Bonjour ! Je suis votre Assistant IA NouanKanyAI. Je suis connecté à vos modèles XGBoost et Isolation Forest en temps réel. Comment puis-je vous aider ?' };
  const [messages, setMessages] = useState<any[]>([defaultMessage]);
  const [isClient, setIsClient] = useState(false);
  const [chatKey, setChatKey] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Charge l'historique de chat propre à l'utilisateur connecté (clé dédiée par user_id :
  // sans ça, tous les comptes utilisés dans le même navigateur partageaient la même conversation).
  useEffect(() => {
    const loadHistory = async () => {
      const user = await getCurrentUser();
      const key = user ? `energai_chat_history_${user.id}` : null;
      setChatKey(key);
      if (key) {
        const savedChat = localStorage.getItem(key);
        if (savedChat) {
          try {
            setMessages(JSON.parse(savedChat));
          } catch (e) {
            console.error("Erreur de chargement de l'historique", e);
          }
        }
      }
      setIsClient(true);
    };
    loadHistory();
  }, []);

  // Save chat history to localStorage on change
  useEffect(() => {
    if (isClient && chatKey) {
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, isClient, chatKey]);

  // Fetch true recommendations from FastAPI
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // On récupère d'abord l'état actuel depuis l'API globale
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
  }, []);

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    
    const userMsg = inputMessage;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputMessage('');
    
    // Add loading message
    setMessages(prev => [...prev, { sender: 'ai', text: "..." }]);
    
    try {
      // On récupère d'abord l'état actuel depuis l'API globale
      const machinesRes = await fetch(`${API_URL}/api/machines`, { headers: authHeaders() });
      const currentMachinesState = await machinesRes.json();
      
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context: currentMachinesState })
      });
      
      const data = await response.json();
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { sender: 'ai', text: data.response };
        return newMsgs;
      });
    } catch (error) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { sender: 'ai', text: "Erreur de connexion a l'IA NouanKanyAI." };
        return newMsgs;
      });
    }
  };

  const executeAction = async (rec: any) => {
    const actionText = `J'exécute l'action recommandée : "${rec.action}" suite à "${rec.title}". Lance l'analyse...`;
    
    // Optimistic UI update
    setMessages(prev => [...prev, { sender: 'user', text: actionText }]);
    setMessages(prev => [...prev, { sender: 'ai', text: "Lancement du protocole d'intervention en cours..." }]);
    
    try {
      const machinesRes = await fetch(`${API_URL}/api/machines`, { headers: authHeaders() });
      const currentMachinesState = await machinesRes.json();
      
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: actionText, context: currentMachinesState })
      });
      
      const data = await response.json();
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { sender: 'ai', text: data.response };
        return newMsgs;
      });
    } catch (error) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { sender: 'ai', text: "Erreur lors de l'exécution de l'action." };
        return newMsgs;
      });
    }
  };

  const getIconForType = (type: string, severity: string) => {
    if (severity === 'critique') return <ShieldAlert size={20} color="#DC2626" />;
    if (type === 'optimisation') return <Sparkles size={20} color="var(--primary)" />;
    if (type === 'délestage') return <Zap size={20} color="var(--accent)" />;
    return <Bot size={20} color="var(--primary)" />;
  };

  const getColorForSeverity = (severity: string) => {
    if (severity === 'critique') return '#DC2626';
    if (severity === 'modérée') return 'var(--accent)';
    return 'var(--primary)';
  };

  // Helper to remove or format markdown symbols like **, ###, * from AI responses
  const formatText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/###/g, '') // Remove ###
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold stars but keep text
      .replace(/\*/g, '•'); // Replace remaining single stars with a clean bullet point
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>
          <span style={{ color: 'var(--primary)' }}>Assistant IA</span> / Analyse & Chat
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--foreground)' }}>Votre Assistant Énergétique Intégré</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          L'IA analyse vos équipements en temps réel avec XGBoost et Isolation Forest pour générer des actions concrètes.
        </p>
      </div>

      <div className="grid-2-equal predictions-grid" style={{ height: '600px' }}>
        
        {/* Chat Interface */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'var(--primary)', padding: '8px', borderRadius: '50%' }}><Bot color="#fff" size={20} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>NouanKanyAI Copilot</div>
              <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>● En ligne et synchronisé (FastAPI)</div>
            </div>
          </div>
          
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--background-alt)' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{ 
                  backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--surface)', 
                  color: msg.sender === 'user' ? '#fff' : 'var(--foreground)',
                  padding: '12px 16px', borderRadius: '12px',
                  border: msg.sender === 'ai' ? '1px solid var(--surface-border)' : 'none',
                  fontSize: '14px', lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {formatText(msg.text)}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ padding: '16px', borderTop: '1px solid var(--surface-border)', backgroundColor: 'var(--surface)', display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Demandez une analyse, un rapport, ou une prédiction..." 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--surface-border)', outline: 'none', backgroundColor: 'var(--background-alt)' }}
            />
            <button onClick={handleSend} style={{ backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Actionable Recommendations (FETCHED FROM API) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            RECOMMANDATIONS DE L'IA ({recommendations.length})
            {loadingRecs && <Loader2 size={16} className="animate-spin text-primary" />}
          </h3>
          
          {!loadingRecs && recommendations.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              Aucune recommandation pour le moment. Votre usine est optimale !
            </div>
          ) : (
            recommendations.map((rec, idx) => {
              const color = getColorForSeverity(rec.severity);
              return (
                <div key={idx} className="glass-card" style={{ borderLeft: `4px solid ${color}` }}>
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
                        ) : (
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>ACTION CRITIQUE</div>
                        )}
                        <button
                                onClick={() => executeAction(rec)}
                                className={rec.severity === 'critique' ? "btn-secondary" : "btn-primary"}
                                style={{ width: '100%', padding: '8px 14px', fontSize: '12px', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.4, borderColor: rec.severity === 'critique' ? '#DC2626' : '', color: rec.severity === 'critique' ? '#DC2626' : '', cursor: 'pointer' }}>
                          {rec.action}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
