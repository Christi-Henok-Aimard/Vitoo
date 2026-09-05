import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Flag, MapPin, Navigation, Satellite } from 'lucide-react';
import { getDriverTripByIdApi, updateDriverStatusApi, updateTripPositionApi, updateTripStatusApi, type TripData } from '../../api/driverApi';

interface LiveError { code: string; message: string }

export const DriverTracking: React.FC<{ tripId: string; onBack: () => void; onFinished: () => void }> = ({ tripId, onBack, onFinished }) => {
  const [trip, setTrip] = useState<TripData | null>(null);
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null);
  const [liveError, setLiveError] = useState<LiveError | null>(null);
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [arrivalStats, setArrivalStats] = useState<{ boarded: number; paid: number } | null>(null);

  const lastPushRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getDriverTripByIdApi(tripId);
        if (!mounted) return;
        setTrip(res.trip);
        if (res.trip.latitude && res.trip.longitude) setPos({ lat: res.trip.latitude, lon: res.trip.longitude });
        setArrivalStats({ boarded: res.tickets.filter((t) => t.status === 'used').length, paid: res.tickets.filter((t) => t.status === 'active').length + res.tickets.filter((t) => t.status === 'used').length });
        if (res.trip.status !== 'in_transit') {
          await updateTripStatusApi(tripId, 'in_transit');
          await updateDriverStatusApi('on_trip');
        }
        setStarting(false);
      } catch (err) {
        if (mounted) { setLiveError({ code: 'load', message: err instanceof Error ? err.message : 'Impossible de charger le trajet.' }); setStarting(false); }
      }
    })();
    return () => { mounted = false; };
  }, [tripId]);

  const pushPosition = useCallback((lat: number, lon: number) => {
    const now = Date.now();
    if (now - lastPushRef.current < 8000) return;
    lastPushRef.current = now;
    void updateTripPositionApi(tripId, lat, lon).catch(() => undefined);
  }, [tripId]);

  useEffect(() => {
    setLiveError(null);
    const timeout = window.setTimeout(() => {
      if (!('geolocation' in navigator)) {
        setLiveError({ code: 'unsupported', message: 'La géolocalisation n\u2019est pas disponible sur ce navigateur.' });
        return;
      }
      const watch = navigator.geolocation.watchPosition(
        (p) => {
          setPos({ lat: p.coords.latitude, lon: p.coords.longitude });
          pushPosition(p.coords.latitude, p.coords.longitude);
        },
        (err) => setLiveError({ code: 'denied', message: 'Position GPS inaccessible — ' + err.message }),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
      return () => navigator.geolocation.clearWatch(watch);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [pushPosition, tripId]);

  const finishWithConfirmation = async () => {
    setBusy(true);
    try {
      await updateTripStatusApi(tripId, 'completed');
      await updateDriverStatusApi('available');
      setArrived(true);
      onFinished();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Impossible de confirmer l\u2019arrivée.');
    } finally {
      setBusy(false);
    }
  };

  if (starting) return <div className="loading-state"><div className="loading-spinner" /></div>;

  if (arrived) {
    return (
      <div className="fade-in arrival-confirmed">
        <CheckCircle2 size={48} style={{ color: '#0d8a6a' }} />
        <h2 className="section-title" style={{ marginTop: '0.5rem' }}>Trajet terminé, merci !</h2>
        {arrivalStats && (
          <div className="arrival-summary" style={{ margin: '1rem 0' }}>
            <div className="arrival-stat"><span>Passagers payés</span><strong>{arrivalStats.paid}</strong></div>
            <div className="arrival-stat"><span>Embarqués</span><strong>{arrivalStats.boarded}</strong></div>
            <div className="arrival-stat"><span>Places</span><strong>{trip?.totalSeats ?? '—'}</strong></div>
          </div>
        )}
        <button type="button" className="action-btn primary" onClick={onBack}>Retour à mes missions</button>
      </div>
    );
  }

  const bbox = pos
    ? `${pos.lon - 0.012},${pos.lat - 0.008},${pos.lon + 0.012},${pos.lat + 0.008}`
    : '-4.02,5.28,-4.00,5.34';

  return (
    <div className="fade-in">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour à la mission</button>
      <div className="page-heading">
        <span className="hero-eyebrow">Suivi en direct</span>
        <h1>{trip?.depart} → {trip?.arrivee}</h1>
        <p>Votre position est partagée en temps réel avec les passagers et votre compagnie.</p>
        <span className="pill pill-green"><Navigation size={14} /> Trajet en cours</span>
      </div>

      {liveError ? (
        <div className="qr-error" style={{ marginTop: '0.75rem' }}>{liveError.message}</div>
      ) : (
        <p className="boarding-hint"><Satellite size={14} /> Suivi actif — mise à jour toutes les 8 secondes.</p>
      )}

      {pos && (
        <div className="live-map" style={{ margin: '1rem 0' }}>
          <iframe
            title="Position en direct"
            width="100%"
            height="320"
            style={{ border: 0, borderRadius: '16px' }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${pos.lat},${pos.lon}`}
          />
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: 'var(--vitoo-text-soft, #77869c)', fontSize: '0.78rem' }}>
            <MapPin size={14} /> {pos.lat.toFixed(5)}, {pos.lon.toFixed(5)}
          </p>
        </div>
      )}

      <div className="depart-card">
        <div>
          <h3>Arrivée à destination ?</h3>
          <p>Confirmez la fin du trajet : le statut passe à « terminé » et vos passagers en sont informés.</p>
        </div>
        <button type="button" className="action-btn primary" onClick={() => void finishWithConfirmation()} disabled={busy}>
          <Flag size={18} /> {busy ? 'Confirmation…' : 'Arrivée à destination'}
        </button>
      </div>
    </div>
  );
};