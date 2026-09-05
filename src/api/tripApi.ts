import type { Trip, TripSearchParams } from '../types/trip';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const fetchTripsApi = async (params?: TripSearchParams): Promise<Trip[]> => {
  const query = new URLSearchParams();
  if (params?.depart) query.set('depart', params.depart);
  if (params?.arrivee) query.set('arrivee', params.arrivee);
  if (params?.date) query.set('date', params.date);
  if (params?.company) query.set('company', params.company);
  const response = await fetch(`${API_BASE}/trips?${query.toString()}`);
  if (!response.ok) throw new Error('Impossible de charger les trajets.');
  const data = (await response.json()) as { trips: Trip[] };
  return data.trips;
};

export const fetchCompaniesApi = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE}/trips/companies`);
  if (!response.ok) throw new Error('Impossible de charger les compagnies.');
  const data = (await response.json()) as { companies: string[] };
  return data.companies;
};

export const fetchCitiesApi = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE}/trips/cities`);
  if (!response.ok) throw new Error('Impossible de charger les villes.');
  const data = (await response.json()) as { cities: string[] };
  return data.cities;
};

export const fetchTripByIdApi = async (tripId: string): Promise<Trip | null> => {
  const response = await fetch(`${API_BASE}/trips/${tripId}`);
  if (!response.ok) return null;
  const data = (await response.json()) as { trip: Trip };
  return data.trip;
};
