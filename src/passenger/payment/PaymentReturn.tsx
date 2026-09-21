import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { confirmPaymentApi, saveLastBooking } from '../../api/paymentApi';
import type { Booking } from '../../types/booking';
import { Ticket } from '../booking/Ticket';

type PaymentState = 'checking' | 'paid' | 'failed';

const MAX_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 2500;

// Écran de retour après paiement en ligne (CinetPay ou simulation locale).
// Vérifie le statut côté serveur puis affiche le billet une fois confirmé.
export const PaymentReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const navigate = useNavigate();
  const [state, setState] = useState<PaymentState>(paymentId ? 'checking' : 'failed');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState(paymentId ? '' : 'Paiement introuvable dans l\'URL de retour.');
  const [attempt, setAttempt] = useState(0);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!paymentId) return undefined;
    let active = true;
    let timer = 0;

    const poll = async () => {
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        if (active) {
          setState('failed');
          setMessage('Le paiement est toujours en attente de confirmation. Revenez sur votre espace un peu plus tard : votre billet sera disponible automatiquement.');
        }
        return;
      }
      attemptsRef.current += 1;
      try {
        const result = await confirmPaymentApi(paymentId);
        if (!active) return;
        if (result.status === 'paid' && result.booking) {
          saveLastBooking(result.booking);
          setBooking(result.booking);
          setState('paid');
        } else if (result.status === 'failed') {
          setMessage(result.message || 'Paiement refusé. Vous pouvez réessayer.');
          setState('failed');
        } else {
          timer = window.setTimeout(() => void poll(), POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!active) return;
        setMessage(err instanceof Error ? err.message : 'Impossible de confirmer le paiement.');
        setState('failed');
      }
    };

    void poll();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [paymentId, attempt]);

  const retry = () => {
    attemptsRef.current = 0;
    setMessage('');
    setState('checking');
    setAttempt((current) => current + 1);
  };

  const goHome = () => navigate('/passenger');

  if (state === 'checking') {
    return (
      <div className="app-shell">
        <main className="app-content" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
          <div className="payment-return-card">
            <div className="loading-spinner" />
            <h1>Vérification de votre paiement…</h1>
            <p>Confirmation en cours auprès de la banque / du mobile money. Ne fermez pas cette page.</p>
            <small style={{ color: 'var(--vitoo-text-soft, #77869c)' }}>Quelques secondes suffisent habituellement.</small>
          </div>
        </main>
      </div>
    );
  }

  if (state === 'paid' && booking) {
    return (
      <div className="app-shell">
        <main className="app-content">
          <div className="payment-return-card" style={{ marginBottom: '1.25rem' }}>
            <CheckCircle2 size={40} style={{ color: '#0d8a6a' }} />
            <h1>Paiement confirmé !</h1>
            <p>Votre place est réservée. Voici votre e-billet {booking.trip?.depart ? `pour ${booking.trip.depart} → ${booking.trip.arrivee}` : ''}.</p>
            <button className="primary-action" onClick={goHome}>Retour à mes billets</button>
          </div>
          <Ticket booking={booking} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="app-content" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
        <div className="payment-return-card">
          <XCircle size={40} style={{ color: '#f06464' }} />
          <h1>Paiement non confirmé</h1>
          <p>{message}</p>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="primary-action" onClick={retry}><RefreshCw size={16} /> Réessayer</button>
            <button className="action-btn" onClick={goHome}>Retour à l'accueil</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentReturn;