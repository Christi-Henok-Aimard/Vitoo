import React from 'react';
import type { Trip } from '../../types/trip';
import { Bus, Navigation, ArrowRight } from 'lucide-react';

interface ActiveTripBannerProps {
  trip: Trip;
  onTrack: () => void;
}

export const ActiveTripBanner: React.FC<ActiveTripBannerProps> = ({ trip, onTrack }) => {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-lg">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
          <Bus className="h-6 w-6" />
        </div>
        <div>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
            Trajet en cours
          </span>
          <h4 className="mt-1 font-bold text-lg">
            {trip.depart} <ArrowRight className="inline h-4 w-4" /> {trip.arrivee}
          </h4>
          <p className="text-xs text-blue-100">Départ : {trip.time} • Gare: {trip.station}</p>
        </div>
      </div>

      <button
        onClick={onTrack}
        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 shadow-sm"
      >
        <Navigation className="h-4 w-4" />
        Suivre en GPS
      </button>
    </div>
  );
};