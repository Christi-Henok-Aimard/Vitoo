import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Flag, MapPin, Navigation, Play, Satellite, Square } from 'lucide-react';
import { getDriverTripByIdApi, updateDriverStatusApi, updateTripPositionApi, updateTripStatusApi, type TripData } from '../../api/driverApi';
import { LiveMap } from '../../shared/maps/LiveMap';
import { resolveCity } from '../../shared/maps/cities';
import { useDemoPosition, useRoute } from '../../shared/maps/useRoute';
import type { LatLng } from '../../shared/maps/geolib';

interface LiveError { code: string; message: string }

export const DriverTracking: React.FC<{ tripId: string; onBack: () => void; onFinished: () => void }> = ({ tripId, onBack, onFinished }) => {
  const [trip, setTrip] = useState<TripData | null>(null);
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null);
  const [liveError, setLiveError] = useState<LiveError | null>(null);
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [demoPlay, setDemoPlay] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
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

  const fromPoint = resolveCity(trip?.depart);
  const toPoint = resolveCity(trip?.arrivee);
  const { route } = useRoute(
    fromPoint && toPoint ? [fromPoint.lat, fromPoint.lon] : null,
    fromPoint && toPoint ? [toPoint.lat, toPoint.lon] : null,
  );

  useEffect(() => {
    if (demoPlay) return;
    // Réinitialise les erreurs GPS précédentes avant de relancer l'écoute.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiveError(null);
    const timeout = window.setTimeout(() => {
      if (!('geolocation' in navigator)) {
        setLiveError({ code: 'unsupported', message: 'La géolocalisation n’est pas disponible sur ce navigateur.' });
        return;
      }
      const watch = navigator.geolocation.watchPosition(
        (p) => {
          setLiveActive(true);
          setPos({ lat: p.coords.latitude, lon: p.coords.longitude });
          pushPosition(p.coords.latitude, p.coords.longitude);
        },
        (err) => setLiveError({ code: 'denied', message: 'Position GPS inaccessible — ' + err.message }),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
      return () => navigator.geolocation.clearWatch(watch);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [pushPosition, tripId, demoPlay]);

  const handleDemoTick = useCallback((position: LatLng) => {
    setPos({ lat: position[0], lon: position[1] });
    pushPosition(position[0], position[1]);
  }, [pushPosition]);

  useDemoPosition(demoPlay, 3, route, handleDemoTick);

  const toggleDemo = () => {
    if (demoPlay) { setDemoPlay(false); setLiveActive(true); }
    else { setDemoPlay(true); }
  };

  const finishWithConfirmation = async () => {
    setBusy(true);
    try {
      await updateTripStatusApi(tripId, 'completed');
      await updateDriverStatusApi('available');
      setArrived(true);
      onFinished();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Impossible de confirmer l’arrivée.');
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

  return (
    <div className="fade-in">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour à la mission</button>
      <div className="page-heading">
        <span className="hero-eyebrow">Suivi en direct</span>
        <h1>{trip?.depart} → {trip?.arrivee}</h1>
        <p>Votre position est partagée en temps réel avec les passagers et votre compagnie.</p>
        <span className="pill pill-green"><Navigation size={14} /> Trajet en cours</span>
      </div>

      <div className="vitoo-tracking-toolbar" style={{ margin: '0.75rem 0 1rem' }}>
        <button type="button" className={demoPlay ? 'active' : ''} onClick={toggleDemo}>
          {demoPlay ? <><Square size={14} /> Désactiver la démo</> : <><Play size={14} /> Lecture démo du trajet</>}
        </button>
        {liveActive && !demoPlay ? (
          <span className="vitoo-live-badge"><Satellite size={14} /> GPS réel actif</span>
        ) : demoPlay ? (
          <span className="vitoo-live-badge">Démo — le car avance sur l'itinéraire</span>
        ) : null}
      </div>

      {liveError && !demoPlay ? (
        <div className="qr-error" style={{ marginTop: '0.75rem' }}>{liveError.message}</div>
      ) : (
        <p className="boarding-hint"><Satellite size={14} /> {demoPlay ? 'Mode démo — la position est envoyée au réseau à chaque étape.' : liveActive ? 'Suivi actif — mise à jour toutes les 8 secondes.' : 'En attente du signal GPS…'}</p>
      )}

      <div className="live-map" style={{ margin: '1rem 0' }}>
        <LiveMap
          from={{ city: trip?.depart }}
          to={{ city: trip?.arrivee }}
          vehicle={pos ? { lat: pos.lat, lon: pos.lon, lastPositionAt: new Date().toISOString() } : null}
          height={360}
          precomputedRoute={route}
        />
        <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: 'var(--vitoo-text-soft, #77869c)', fontSize: '0.78rem' }}>
          <MapPin size={14} /> {pos ? `${pos.lat.toFixed(5)}, ${pos.lon.toFixed(5)}` : 'Position en attente'}
        </p>
      </div>

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