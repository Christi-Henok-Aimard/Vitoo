import React, { useEffect, useState } from 'react';
import type { Trip } from '../../types/trip';
import { fetchTripByIdApi } from '../../api/tripApi';
import { MapPin, Phone, Share2, Navigation, Route, User } from 'lucide-react';

interface MapTrackingViewProps {
  trip: Trip;
  onArrive?: () => void;
}

// Suivi de course : affiche la position GPS réelle du car
// (publiée par le chauffeur) tant qu'elle est disponible.
export const MapTrackingView: React.FC<MapTrackingViewProps> = ({ trip, onArrive }) => {
  const [liveTrip, setLiveTrip] = useState<Trip | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const fresh = await fetchTripByIdApi(trip.id).catch(() => null);
      if (!active || !fresh) return;
      setLiveTrip(fresh);
      if (typeof fresh.latitude === 'number' && typeof fresh.longitude === 'number') {
        setLastUpdated(new Date());
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 8000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [trip.id]);

  const current = liveTrip ?? trip;
  const hasPosition = typeof current.latitude === 'number' && typeof current.longitude === 'number';
  const stops = current.stops && current.stops.length > 1 ? current.stops : [current.depart, current.arrivee];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="tracking-map">
        <div className="map-road map-road-one" /><div className="map-road map-road-two" /><div className="map-road map-road-three" />
        <span className="map-city map-city-start">{trip.depart}</span><span className="map-city map-city-end">{trip.arrivee}</span>
        <div className="map-route">
          <span className="map-dot" />
          {hasPosition && <span className="map-car"><Navigation /></span>}
          <span className="map-dot" />
        </div>
        <div className="map-live">
          {hasPosition ? (
            <><MapPin /> Position GPS reçue · {current.latitude?.toFixed(5)}, {current.longitude?.toFixed(5)} · actualisée à {lastUpdated?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) || '—'}</>
          ) : (
            <><MapPin /> En attente de la position GPS du car…</>
          )}
        </div>
      </div>

      <div className="p-4">
        <p className="tracking-progress-label">
          {hasPosition ? (
            <>Suivi en direct · {trip.depart} → {trip.arrivee}</>
          ) : (
            <>Le chauffeur n'a pas encore activé la localisation. Le suivi se met à jour automatiquement.</>
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