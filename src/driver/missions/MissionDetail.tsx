import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bus, CalendarDays, Clock3, CreditCard, Footprints, MapPin, MessageCircle, QrCode, Route, ShieldAlert, Users } from 'lucide-react';
import { getDriverTripByIdApi, updateTripStatusApi, updateDriverStatusApi, type TripData, type TicketData } from '../../api/driverApi';

const loading = () => (
  <div className="loading-state"><div className="loading-spinner" /></div>
);

const formatDate = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const MissionDetail: React.FC<{
  tripId: string;
  onBack: () => void;
  onScan: (tripId: string) => void;
  onIncident: (tripId: string) => void;
  onTracking: (tripId: string) => void;
  onChat: (tripId: string) => void;
  onChanged?: () => void;
}> = ({ tripId, onBack, onScan, onIncident, onTracking, onChat, onChanged }) => {
  const [trip, setTrip] = useState<TripData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await getDriverTripByIdApi(tripId);
      setTrip(res.trip);
      setTickets(res.tickets);
      setError('');
    } catch (err) {
      if (trip === null) setError(err instanceof Error ? err.message : 'Impossible de charger la mission.');
    }
  }, [tripId, trip]);

  useEffect(() => {
    // Chargement initial + rafraîchissement périodique de la mission.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const timer = window.setInterval(() => { void reload(); }, 8000);
    return () => window.clearInterval(timer);
  }, [reload]);

  const paid = tickets.filter((t) => t.status === 'active');
  const boarded = tickets.filter((t) => t.status === 'used');
  const missing = paid.filter((p) => !boarded.some((b) => b.id === p.id)).length;
  const paidCount = paid.length + boarded.length;
  const boardingPct = paidCount === 0 ? 0 : Math.round((boarded.length / paidCount) * 100);
  const allBoarded = paidCount > 0 && boarded.length >= paidCount;

  const finishTrip = async () => {
    setBusy(true);
    try {
      await updateTripStatusApi(tripId, 'completed');
      await updateDriverStatusApi('available');
      onChanged?.();
      onBack();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Impossible de terminer le trajet.');
    } finally {
      setBusy(false);
    }
  };

  const startLive = async () => {
    setBusy(true);
    try {
      await updateTripStatusApi(tripId, 'in_transit');
      await updateDriverStatusApi('on_trip');
      onChanged?.();
      onTracking(tripId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Impossible de démarrer le suivi.');
    } finally {
      setBusy(false);
    }
  };

  if (error && !trip) return <div className="fade-in"><button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour aux missions</button><p className="empty-state">{error}</p></div>;
  if (!trip) return loading();

  return (
    <div className="fade-in">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour aux missions</button>

      <div className="mission-header">
        <div>
          <span className="hero-eyebrow">Mission assignée</span>
          <h1 className="section-title" style={{ marginTop: '0.25rem' }}>{trip.depart} → {trip.arrivee}</h1>
          <span className="trip-meta"><CalendarDays /> {formatDate(trip.date)}</span>
          <span className="trip-meta"><Clock3 /> {trip.time} · Départ {trip.station}</span>
          {trip.company && <span className="trip-meta"><Route /> {trip.company}</span>}
        </div>
        <div className="mission-stat"><span>{(trip.status === 'in_transit' ? 'En route' : trip.status === 'boarding' ? 'Embarquement' : trip.status === 'completed' ? 'Terminé' : trip.status === 'cancelled' ? 'Annulé' : 'Programmé')}</span><small>Statut</small></div>
      </div>

      <div className="info-grid">
        <div className="info-item"><span className="info-label">Prix du billet</span><span className="info-value">{trip.price.toLocaleString('fr-FR')} FCFA</span></div>
        <div className="info-item"><span className="info-label">Places totales</span><span className="info-value">{trip.totalSeats}</span></div>
        <div className="info-item"><span className="info-label">Places restantes</span><span className="info-value">{trip.availableSeats}</span></div>
        <div className="info-item"><span className="info-label">Durée estimée</span><span className="info-value">{trip.duration || '—'}</span></div>
        {trip.vehicle && <div className="info-item"><span className="info-label"><Bus size={14} /> Véhicule</span><span className="info-value">{trip.vehicle.plate} · {trip.vehicle.brand || ''} {trip.vehicle.model || ''}</span></div>}
        <div className="info-item"><span className="info-label"><CreditCard size={14} /> Moyens de paiement</span><span className="info-value">{(trip.paymentMethods?.length ? trip.paymentMethods : ['Espèces']).join(' · ')}</span></div>
        {trip.stops && trip.stops.length > 0 && <div className="info-item" style={{ gridColumn: '1 / -1' }}><span className="info-label">Escales</span><span className="info-value">{trip.stops.join(' → ')}</span></div>}
      </div>

      <div className="boarding-progress" style={{ marginTop: '1rem' }}>
        <div className="boarding-progress-head">
          <span><Footprints size={16} /> Embarquement : <strong>{allBoarded ? 'Tous les passagers sont embarqués' : `${boarded.length}/${paidCount} payés embarqués`}</strong></span>
          <strong>{boardingPct}%</strong>
        </div>
        <div className="boarding-bar"><div className="boarding-bar-fill" style={{ width: `${Math.min(100, boardingPct)}%` }} /></div>
        {missing > 0 ? (
          <p className="boarding-missing">Encore {missing} passager{missing > 1 ? 's' : ''} payé{missing > 1 ? 's' : ''} en attente d'embarquement.</p>
        ) : paidCount > 0 ? (
          <p className="boarding-hint">Tout le monde est là, vous pouvez démarrer le trajet.</p>
        ) : (
          <p className="boarding-hint">Aucun passager payé pour le moment. La liste se met à jour automatiquement dès qu'un billet est vendu.</p>
        )}
      </div>

      <div className="tools-grid" style={{ marginTop: '1rem' }}>
        <button type="button" className="tool-card" onClick={() => onScan(tripId)}><QrCode /><strong>Scanner / codes</strong><small>Scanner les billets et valider l'embarquement</small></button>
        <button type="button" className="tool-card" onClick={() => onChat(tripId)}><MessageCircle /><strong>Contacter la compagnie</strong><small>Messages et notifications</small></button>
        <button type="button" className="tool-card" onClick={() => onIncident(tripId)}><ShieldAlert /><strong>Alerte</strong><small>Signaler un incident</small></button>
      </div>

      {trip.status !== 'in_transit' ? (
        <div className={`depart-card ${allBoarded ? '' : 'depart-card-warn'}`}>
          <div>
            <h3>Prêt à partir ?</h3>
            <p>{allBoarded ? 'Tous les passagers payés sont embarqués : lancez le suivi en direct.' : 'Vérifiez que tout le monde est présent avant de lancer le trajet.'}</p>
          </div>
          <button type="button" className="action-btn primary" onClick={startLive} disabled={busy}>
            <MapPin size={18} /> Démarrer le trajet en direct
          </button>
        </div>
      ) : (
        <div className="depart-card">
          <div>
            <h3>Trajet en cours</h3>
            <p>Le suivi GPS est actif. Les passagers vous voient en direct.</p>
          </div>
          <button type="button" className="action-btn" onClick={() => onTracking(tripId)}><MapPin size={18} /> Voir le suivi</button>
          <button type="button" className="action-btn danger" onClick={finishTrip} disabled={busy}>Terminer le trajet</button>
        </div>
      )}

      <h3 className="section-title">Passagers payés ({paidCount}) — liste en direct</h3>
      <div className="passengers-table-wrapper">
        {paidCount === 0 ? (
          <p className="empty-state"><Users size={48} /> Aucun billet vendu. Les passagers s'ajoutent ici à l'instant où ils paient (guichet ou en ligne).</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Siège</th><th>Passager</th><th>Téléphone</th><th>Paiement</th><th>Montant</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {tickets.filter((t) => t.status === 'active' || t.status === 'used').map((t) => (
                <tr key={t.id}>
                  <td><span className="checkin-seat">{t.seatNumber}</span></td>
                  <td><strong>{t.passengerName}</strong></td>
                  <td>{t.passengerPhone || '—'}</td>
                  <td>{t.paymentMethod || '—'} <small style={{ color: '#77869c' }}>({t.soldBy === 'online' ? 'en ligne' : 'guichet'})</small></td>
                  <td>{t.amount.toLocaleString('fr-FR')} FCFA</td>
                  <td>{t.status === 'used' ? <span className="pill pill-green">Embarqué</span> : <span className="pill pill-blue">Payé</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};