import React from 'react';
import type { Trip } from '../../types/trip';
import { formatPrice } from '../../shared/components/lib/format';
import { X, Bus, User, Clock3, MapPinned, CarFront, Star, ShieldCheck, Phone } from 'lucide-react';

interface TripDetailProps {
  trip: Trip;
  onClose: () => void;
  onBook: () => void;
}

export const TripDetail: React.FC<TripDetailProps> = ({ trip, onClose, onBook }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:text-white">
        <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Détails du trajet</p>
              <h3 className="font-bold text-lg">{trip.company}</h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="my-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400">Itinéraire</p>
              <p className="font-bold text-base">{trip.depart} ➔ {trip.arrivee}</p>
            </div>
            <span className="text-lg font-extrabold text-blue-600">{formatPrice(trip.price)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <span className="text-slate-400">Gare de départ</span>
              <p className="font-semibold">{trip.station}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <span className="text-slate-400">Heure de départ</span>
              <p className="font-semibold">{trip.time}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <span className="flex items-center gap-1 text-slate-400"><Clock3 className="h-3.5 w-3.5" />Durée</span>
              <p className="font-semibold">{trip.duration || 'Non précisée'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <span className="flex items-center gap-1 text-slate-400"><MapPinned className="h-3.5 w-3.5" />Itinéraire</span>
              <p className="font-semibold">{trip.station}</p>
            </div>
          </div>

          {trip.driverName && (
            <div className="driver-profile">
              <div className="driver-avatar"><User /></div><div><p className="text-xs text-slate-400">Votre chauffeur</p><strong>{trip.driverName}</strong><span><Star /> {trip.driverRating ? `${trip.driverRating} · ${trip.driverTrips || 0} trajets` : `Non noté · ${trip.driverTrips || 0} trajets`}</span></div><ShieldCheck className="driver-verified" />
            </div>
          )}
          {trip.driverReview && <p className="driver-review">“{trip.driverReview}”</p>}
          {trip.companyPhone && <a className="company-contact" href={`tel:${trip.companyPhone.replace(/\s/g, '')}`}><Phone /> Contacter {trip.company} <strong>{trip.companyPhone}</strong></a>}
        </div>

        <button
          onClick={onBook}
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow hover:bg-blue-700"
        >
          <CarFront className="mr-2 inline h-5 w-5" /> Réserver ma place
        </button>
      </div>
    </div>
  );
};
