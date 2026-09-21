import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Route, Send } from 'lucide-react';
import { getDriverMessagesApi, sendDriverMessageApi, type ChatMessage } from '../../api/driverApi';

export const DriverMessages: React.FC<{ tripContext?: string }> = ({ tripContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    try {
      const res = await getDriverMessagesApi();
      setMessages(res.messages);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Chargement initial + rafraîchissement périodique des messages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const timer = window.setInterval(() => { void reload(); }, 10000);
    return () => window.clearInterval(timer);
  }, [reload]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    try {
      await sendDriverMessageApi({ tripId: tripContext, body });
      setDraft('');
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Envoi impossible.');
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fade-in">
      <div className="page-heading">
        <span className="hero-eyebrow">Espace chauffeur</span>
        <h1>Conversation avec la compagnie</h1>
        <p>Les assignations de missions, notifications et messages de votre compagnie arrivent ici automatiquement.</p>
        {tripContext && <span className="pill pill-blue"><Route size={14} /> Conversation liée à votre mission en cours</span>}
      </div>

      {error && !loading && <p className="empty-state">{error}</p>}
      {loading && messages.length === 0 ? (
        <div className="loading-state"><div className="loading-spinner" /></div>
      ) : (
        <div className="chat-box">
          <div className="chat-messages" ref={boxRef}>
            {messages.length === 0 ? (
              <p className="empty-state"><MessageCircle size={48} /> Aucun message pour le moment.<br />Écrivez à votre compagnie, elle vous répondra ici.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`chat-bubble ${msg.sender === 'driver' ? 'chat-bubble-me' : 'chat-bubble-other'}`}>
                  <div className="chat-bubble-meta">{msg.sender === 'company' ? 'Compagnie' : 'Vous'} · {formatTime(msg.createdAt)}</div>
                  <div className="chat-bubble-body">{msg.body}</div>
                </div>
              ))
            )}
          </div>
          <div className="chat-input-row">
            <input
              className="field-input"
              placeholder="Écrivez un message à votre compagnie…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void send(); } }}
            />
            <button type="button" className="primary-action" onClick={() => void send()} disabled={!draft.trim()}>Envoyer <Send size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};