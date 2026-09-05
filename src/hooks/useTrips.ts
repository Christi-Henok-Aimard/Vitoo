import { useState, useEffect, useCallback, useRef } from 'react';
import type { Trip, TripSearchParams } from '../types/trip';
import { fetchTripsApi } from '../api/tripApi';

export const useTrips = (initialParams?: TripSearchParams) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchTrips = useCallback(async (params?: TripSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTripsApi(params);
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des trajets');
    } finally {
      setLoading(false);
    }
  }, []);

  const initialSearchDone = useRef(false);
  useEffect(() => {
    if (initialSearchDone.current) return;
    initialSearchDone.current = true;
    void searchTrips(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { trips, loading, error, searchTrips };
};