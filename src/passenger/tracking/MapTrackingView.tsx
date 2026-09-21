import React, { useCallback, useEffect, useState } from 'react';
import type { Trip } from '../../types/trip';
import { fetchTripByIdApi } from '../../api/tripApi';
import { MapPin, Phone, Play, Share2, Route, Satellite, Square, User } from 'lucide-react';
import { LiveMap } from '../../shared/maps/LiveMap';
import { resolveCity } from '../../shared/maps/cities';
import { useDemoPosition, useRoute } from '../../shared/maps/useRoute';
import type { LatLng } from '../../shared/maps/geolib';

interface MapTrackingViewProps {
  trip: Trip;
  onArrive?: () => void;
}

// Suivi de course : affiche la position GPS réelle du car
// (publiée par le chauffeur) quand elle est disponible.
// Pour la présentation : « Lecture démo » fait avancer le car
// sur l'itinéraire comme sur Yango, même sans chauffeur en ligne.
export const MapTrackingView: React.FC<MapTrackingViewProps> = ({ trip, onArrive }) => {
  const [liveTrip, setLiveTrip] = useState<Trip | null>(null);
  const [shared, setShared] = useState(false);
  const [demoPlay, setDemoPlay] = useState(false);
  const [demoPos, setDemoPos] = useState<LatLng | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const fresh = await fetchTripByIdApi(trip.id).catch(() => null);
      if (!active || !fresh) return;
      setLiveTrip(fresh);
    };
    // Réinitialise l'état en direct quand on change de trajet pour ne pas afficher les données du précédent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiveTrip(null);
    void refresh();
    const timer = window.setInterval(() => void refresh(), 8000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [trip.id]);

  const fromPoint = resolveCity(trip.depart);
  const toPoint = resolveCity(trip.arrivee);
  const { route } = useRoute(
    fromPoint && toPoint ? [fromPoint.lat, fromPoint.lon] : null,
    fromPoint && toPoint ? [toPoint.lat, toPoint.lon] : null,
  );

  const handleDemoTick = useCallback((position: LatLng) => {
    setDemoPos(position);
  }, []);

  useDemoPosition(demoPlay, 3, route, handleDemoTick);

  const current = liveTrip ?? trip;
  const hasPosition = typeof current.latitude === 'number' && typeof current.longitude === 'number';
  const stops = current.stops && current.stops.length > 1 ? current.stops : [current.depart, current.arrivee];

  const useDemo = demoPlay && demoPos !== null;
  const vehicle = useDemo
    ? { lat: demoPos[0], lon: demoPos[1], lastPositionAt: new Date().toISOString() }
    : hasPosition
      ? { lat: current.latitude, lon: current.longitude, lastPositionAt: current.lastPositionAt }
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <LiveMap
        from={{ city: trip.depart }}
        to={{ city: trip.arrivee }}
        stops={stops.map((city) => ({ city }))}
        vehicle={vehicle}
        precomputedRoute={route}
        height={300}
      />

      <div className="p-4">
        <div className="vitoo-tracking-toolbar" style={{ marginBottom: '0.6rem' }}>
          <button type="button" className={demoPlay ? 'active' : ''} onClick={() => setDemoPlay((v) => !v)}>
            {demoPlay ? <><Square size={14} /> Arrêter la démo</> : <><Play size={14} /> Lecture démo du trajet</>}
          </button>
          {useDemo ? (
            <span className="vitoo-live-badge"><Play size={14} /> Démo — le car avance vers {trip.arrivee}</span>
          ) : hasPosition ? (
            <span className="vitoo-live-badge"><Satellite size={14} /> GPS réel du car actif</span>
          ) : null}
        </div>
        <p className="tracking-progress-label">
          {useDemo ? (
            <>Démo en direct · {trip.depart} → {trip.arrivee} · le car avance sur l'itinéraire</>
          ) : hasPosition ? (
            <>Suivi en direct · {trip.depart} → {trip.arrivee}</>
          ) : (
            <>Le chauffeur n'a pas encore activé la localisation. Lancez la démo pour voir le car bouger. Le suivi réel se met à jour automatiquement.</>
          )}
        </p>

        <div className="tracking-itinerary">
          <b>Itinéraire complet</b>
          <ol>
            {stops.map((stop, index) => (
              <li key={`${stop}-${index}`}>{stop}</li>
            ))}
          </ol>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-xs text-slate-400">Chauffeur assigné</p>
            <p className="font-semibold text-sm">{trip.driverName || 'N/A'}</p>
          </div>
          <a href={trip.companyPhone ? `tel:${trip.companyPhone.replace(/\s/g, '')}` : '#'} className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:bg-blue-950/40">
            <Phone className="h-3.5 w-3.5" />
            Appeler
          </a>
          <button className="share-button" onClick={async () => {
            const text = `Trajet Vitoo : ${trip.depart} vers ${trip.arrivee} avec ${trip.company} · position suivie en direct`;
            if (navigator.share) await navigator.share({ title: 'Mon trajet Vitoo', text });
            else await navigator.clipboard?.writeText(text);
            setShared(true);
            window.setTimeout(() => setShared(false), 2200);
          }}><Share2 /> {shared ? 'Lien copié' : 'Partager'}</button>
        </div>
        <div className="tracking-route"><span>{trip.depart}</span><i /><span>{trip.arrivee}</span></div>
        <div className="tracking-details"><div><Route /> <span><small>Itinéraire</small><b>{trip.station} · {trip.duration || 'Durée en cours'}</b></span></div><div><User /> <span><small>Chauffeur</small><b>{trip.driverName || 'Non renseigné'}</b></span></div></div>
        {onArrive && <button className="arrive-button" onClick={onArrive}><MapPin /> Je suis arrivé à destination</button>}
      </div>
    </div>
  );
};