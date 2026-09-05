import React, { useEffect, useState } from 'react';
import type { TripSearchParams } from '../../types/trip';
import { Search, MapPin, CalendarDays } from 'lucide-react';
import { fetchCitiesApi } from '../../api/tripApi';

interface TripSearchHeadProps {
  onSearch: (params: TripSearchParams) => void;
  company?: string;
}

export const TripSearchHead: React.FC<TripSearchHeadProps> = ({ onSearch, company = 'Toutes les compagnies' }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [depart, setDepart] = useState('');
  const [arrivee, setArrivee] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    let active = true;
    fetchCitiesApi()
      .then((cityList) => { if (active) setCities(cityList); })
      .catch(() => { if (active) setCities([]); });
    return () => { active = false; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ depart, arrivee, date, company });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 rounded-xl border p-2.5 dark:border-slate-800">
          <MapPin className="h-4 w-4 text-blue-600" />
          <input
            type="text"
            placeholder="Ville de départ"
            value={depart}
            onChange={(e) => setDepart(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
            list="vitoo-cities"
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border p-2.5 dark:border-slate-800">
          <MapPin className="h-4 w-4 text-indigo-600" />
          <input
            type="text"
            placeholder="Ville d'arrivée"
            value={arrivee}
            onChange={(e) => setArrivee(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
            list="vitoo-cities"
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border p-2.5 dark:border-slate-800">
          <CalendarDays className="h-4 w-4 text-vitoo-coral" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
            aria-label="Date du départ"
          />
        </div>
      </div>
      <datalist id="vitoo-cities">{cities.map((city) => <option key={city} value={city} />)}</datalist>

      <button
        type="submit"
        className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Search className="h-4 w-4" />
        Rechercher un trajet
      </button>
    </form>
  );
};