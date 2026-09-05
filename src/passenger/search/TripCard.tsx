import React from 'react';
import type { Trip } from '../../types/trip';
import { Bus, Clock, Users, ChevronRight } from 'lucide-react';
import { formatPrice } from '../../shared/components/lib/format';

interface TripCardProps {
  trip: Trip;
  onSelect: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(trip)}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-slate-800 dark:text-slate-100">{trip.company}</span>
        </div>
        <span className="font-extrabold text-blue-600">{formatPrice(trip.price)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-lg">{trip.depart} ➔ {trip.arrivee}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {trip.time} · {trip.duration || 'durée à confirmer'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {trip.availableSeats} places libres
            </span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-slate-400" />
      </div>
    </div>
  );
};
