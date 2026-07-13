'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, MessageCircle } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { authHeaders, getCurrentUser } from '@/lib/auth';

const DEFAULT_MESSAGE = { sender: 'ai', text: "Bonjour ! Je suis votre Assistant IA NouanKanyAI. Je suis connecté à vos modèles XGBoost et Isolation Forest en temps réel. Comment puis-je vous aider ?" };

// Supprime la mise en forme markdown basique des réponses de l'IA (**gras**, ###, *puces*)
function formatText(text: string) {
  if (!text) return '';
  return text
    .replace(/###/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*/g, '•');
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([DEFAULT_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [chatKey, setChatKey] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Charge l'historique de chat propre à l'utilisateur connecté.
  useEffect(() => {
    const loadHistory = async () => {
      const user = await getCurrentUser();
      const key = user ? `energai_chat_history_${user.id}` : null;
      setChatKey(key);
      if (key) {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            setMessages(JSON.parse(saved));
          } catch {
            // ignore, garde le message par défaut
          }
        }
      }
      setIsClient(true);
    };
    loadHistory();
  }, []);

  useEffect(() => {
    if (isClient && chatKey) {
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, isClient, chatKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    setMessages(prev => [...prev, { sender: 'user', text }, { sender: 'ai', text: '...' }]);

    try {
      const machinesRes = await fetch(`${API_URL}/api/machines`, { headers: authHeaders() });
      const currentMachinesState = await machinesRes.json();

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: currentMachinesState })
      });
      const data = await response.json();

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { sender: 'ai', text: data.response };
        return newMsgs;
      });
    } catch {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { sender: 'ai', text: "Erreur de connexion à l'IA NouanKanyAI." };
        return newMsgs;
      });
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const text = inputMessage;
    setInputMessage('');
    sendMessage(text);
  };

  // Permet à n'importe quelle page du dashboard d'ouvrir le chat avec un message pré-rempli
  // (ex: bouton d'action d'une recommandation IA), sans dépendance directe entre composants.
  useEffect(() => {
    const onOpenChat = (e: any) => {
      setIsOpen(true);
      if (e.detail?.message) {
        sendMessage(e.detail.message);
      }
    };
    window.addEventListener('nk-open-chat', onOpenChat);
    return () => window.removeEventListener('nk-open-chat', onOpenChat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 1500,
          width: '58px', height: '58px', borderRadius: '50%',
          backgroundColor: 'var(--primary)', color: '#fff', border: 'none',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        title="Assistant IA"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Panneau de chat flottant */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '98px', right: '28px', zIndex: 1499,
          width: '380px', maxWidth: 'calc(100vw - 40px)', height: '520px', maxHeight: 'calc(100vh - 140px)',
          backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'var(--primary)', padding: '7px', borderRadius: '50%', display: 'flex' }}>
              <Bot color="#fff" size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>NouanKanyAI Copilot</div>
              <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>● En ligne</div>
            </div>
          </div>

          <div ref={scrollRef} style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--background-alt)' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--surface)',
                  color: msg.sender === 'user' ? '#fff' : 'var(--foreground)',
                  padding: '10px 14px', borderRadius: '12px',
                  border: msg.sender === 'ai' ? '1px solid var(--surface-border)' : 'none',
                  fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap'
                }}>
                  {formatText(msg.text)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid var(--surface-border)', backgroundColor: 'var(--surface)', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Demandez une analyse, un rapport..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid var(--surface-border)', outline: 'none', color: 'var(--foreground)', fontSize: '13px' }}
            />
            <button onClick={handleSend} style={{ backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
