import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Clock3, Route, Users, Wrench } from 'lucide-react';
import { reportIncidentApi } from '../../api/driverApi';

const TYPE_LABELS: Array<{ value: 'mechanical' | 'delay' | 'road' | 'passenger' | 'other'; label: string; icon: React.ReactNode }> = [
  { value: 'mechanical', label: 'Panne mécanique', icon: <Wrench size={20} /> },
  { value: 'delay', label: 'Retard', icon: <Clock3 size={20} /> },
  { value: 'road', label: 'Route bloquée', icon: <Route size={20} /> },
  { value: 'passenger', label: 'Problème passager', icon: <Users size={20} /> },
  { value: 'other', label: 'Autre', icon: <AlertTriangle size={20} /> },
];

export const DriverAlert: React.FC<{ tripId: string; onBack: () => void }> = ({ tripId, onBack }) => {
  const [type, setType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!type) return;
    setBusy(true);
    try {
      await reportIncidentApi({
        tripId,
        type: type as 'mechanical' | 'delay' | 'road' | 'passenger' | 'other',
        description: description.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Alerte impossible à envoyer.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="fade-in">
        <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour à la mission</button>
        <div className="arrival-confirmed">
          <div className="qr-success" style={{ marginBottom: '1rem' }}>Alerte envoyée à la compagnie</div>
          <p style={{ color: 'var(--vitoo-text-soft, #77869c)' }}>Votre alerte a bien été transmise. Un responsable de ligne va vous contacter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour à la mission</button>
      <div className="page-heading">
        <span className="hero-eyebrow">Besoin d'aide</span>
        <h1>Signaler un problème</h1>
        <p>Décrivez la situation : votre compagnie reçoit une alerte et peut vous répondre.</p>
      </div>

      <div className="incident-types">
        {TYPE_LABELS.map((t) => (
          <button key={t.value} type="button" className={`incident-type-card ${type === t.value ? 'selected' : ''}`} onClick={() => setType(t.value)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <textarea
        className="field-input"
        rows={4}
        style={{ marginTop: '1rem', resize: 'vertical' }}
        placeholder="Précisez votre situation (optionnel)…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="qr-actions" style={{ marginTop: '1rem' }}>
        <button type="button" className="action-btn danger" onClick={() => void submit()} disabled={!type || busy}>
          {busy ? 'Envoi…' : 'Envoyer l\u2019alerte'}
        </button>
      </div>
    </div>
  );
};