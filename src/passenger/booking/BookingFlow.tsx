import React, { useState } from 'react';
import { ArrowLeft, Check, CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';
import type { PaymentMethod } from '../../types/booking';
import type { Trip } from '../../types/trip';
import { formatPrice } from '../../shared/components/lib/format';

interface BookingFlowProps {
  trip: Trip;
  passengerName: string;
  onBack: () => void;
  onConfirm: (method: PaymentMethod, passengerName: string, passengerPhone: string) => void;
  onPayOnline?: (method: PaymentMethod, passengerName: string, passengerPhone: string, passengerEmail?: string) => Promise<void> | void;
  isLoading?: boolean;
  onlineLoading?: boolean;
}

const isOnlineMethod = (method: string): boolean => method.trim().toLowerCase() !== 'espèces';

export const BookingFlow: React.FC<BookingFlowProps> = ({ trip, passengerName, onBack, onConfirm, onPayOnline, isLoading = false, onlineLoading = false }) => {
  const [step, setStep] = useState<'passenger' | 'payment'>('passenger');
  const [firstName, setFirstName] = useState(passengerName.split(' ')[0] || '');
  const [lastName, setLastName] = useState(passengerName.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const methods: PaymentMethod[] = trip.paymentMethods?.length ? trip.paymentMethods : ['Espèces'];
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(methods[0]);

  const fullName = `${firstName} ${lastName}`.trim();
  const online = isOnlineMethod(selectedMethod);
  const handlePay = () => {
    if (online) {
      void onPayOnline?.(selectedMethod, fullName, phone, email || undefined);
    } else {
      onConfirm(selectedMethod, fullName, phone);
    }
  };

  return (
    <section className="booking-page">
      <button className="back-link" onClick={() => { if (step === 'payment') setStep('passenger'); else onBack(); }}><ArrowLeft /> {step === 'payment' ? 'Retour aux informations du passager' : 'Retour aux détails du trajet'}</button>
      <div className="booking-steps"><span className={step === 'passenger' ? 'current' : 'done'}><Check /> Détails du passager</span><i /><span className={step === 'payment' ? 'current' : ''}><CreditCard /> Paiement</span><i /><span>Billet confirmé</span></div>
      {step === 'passenger' ? (
        <div className="booking-layout">
          <form className="booking-card" onSubmit={(event) => { event.preventDefault(); setStep('payment'); }}>
            <span className="hero-eyebrow">Étape 1</span><h1>Vos détails de passager</h1><p>Ces informations seront associées à votre billet.</p>
            <div className="booking-form-grid"><label>Prénom <em>(obligatoire)</em><input required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label><label>Nom <em>(obligatoire)</em><input required value={lastName} onChange={(event) => setLastName(event.target.value)} /></label><label>Email <em>(optionnel)</em><input type="email" placeholder="vous@exemple.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Numéro de téléphone <em>(obligatoire)</em><input required type="tel" placeholder="07 00 00 00 00" value={phone} onChange={(event) => setPhone(event.target.value)} /></label></div>
            <button className="primary-action" type="submit">Accéder au paiement</button>
          </form><BookingSummary trip={trip} />
        </div>
      ) : (
        <div className="booking-layout">
          <div className="booking-card"><span className="hero-eyebrow">Étape 2</span><h1>Choisissez votre paiement</h1><p>{online ? 'Vous serez redirigé vers le paiement sécurisé (CinetPay) : Wave, Orange Money, MTN MoMo, Moov ou carte bancaire.' : 'Le règlement s\'effectue à l\'embarquement. Ce choix figure sur votre billet.'}</p>
            <div className="payment-list">{methods.map((method) => <button type="button" key={method} className={selectedMethod === method ? 'selected' : ''} onClick={() => setSelectedMethod(method)}><CreditCard /><span><b>{method}</b><small>{isOnlineMethod(method) ? 'Paiement en ligne sécurisé' : 'Paiement à l\'embarquement'}</small></span>{selectedMethod === method && <Check />}</button>)}</div>
            <button className="primary-action" disabled={isLoading || onlineLoading} onClick={handlePay}>
              {online ? (<><ExternalLink />{onlineLoading ? 'Redirection vers le paiement…' : `Payer en ligne · ${formatPrice(trip.price)}`}</>) : (<><ShieldCheck />{isLoading ? 'Confirmation en cours...' : `Confirmer la réservation · ${formatPrice(trip.price)}`}</>)}
            </button>
            <p className="text-xs text-center text-slate-400 mt-2">{online ? 'Paiement 100 % sécurisé. Votre e-billet est généré dès confirmation.' : 'Vous réglez le chauffeur à bord. Votre e-billet sert de preuve de réservation.'}</p></div><BookingSummary trip={trip} />
        </div>
      )}
    </section>
  );
};

const BookingSummary: React.FC<{ trip: Trip }> = ({ trip }) => <aside className="booking-summary"><span className="hero-eyebrow">Votre trajet</span><h2>{trip.depart} → {trip.arrivee}</h2><p>{trip.company} · Départ {trip.time}</p><div className="summary-line">Durée <b>{trip.duration || 'À confirmer'}</b></div><div className="summary-line">Tarif de base <b>{formatPrice(trip.price)}</b></div><div className="summary-line">Frais de service <b>Inclus</b></div><strong>{formatPrice(trip.price)}</strong></aside>;