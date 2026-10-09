import { useCallback, useEffect, useState } from 'react';
import type { LatLng } from './geolib';
import { nearestPointIndex, remainingMetersFrom } from './geolib';

export interface RouteInfo {
  points: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  source: 'mapbox' | 'osrm' | 'straight';
  steps?: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  location: LatLng;
  type?: string;
}

export interface EtaInfo {
  minutesRemaining: number;
  etaLabel: string;
  remainingKm: number;
}

const ROUTER_OSRM = 'https://router.project-osrm.org';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN?.trim();

const fetchMapbox = async (from: LatLng, to: LatLng, via: LatLng[] = []): Promise<RouteInfo | null> => {
  if (!MAPBOX_TOKEN) return null;
  const coordinates = [from, ...via, to].map(([lat, lon]) => `${lon},${lat}`).join(';');
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?alternatives=false&overview=full&geometries=geojson&steps=true&language=fr&access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: Array<[number, number]> };
        legs?: Array<{ steps?: Array<{ distance?: number; duration?: number; maneuver?: { instruction?: string; location?: [number, number]; type?: string } }> }>;
      }>;
    };
    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (data.code !== 'Ok' || !route || !coords || coords.length < 2) return null;
    const steps = (route.legs || []).flatMap((leg) =>
      (leg.steps || []).flatMap((step) => {
        const location = step.maneuver?.location;
        if (!location || !step.maneuver?.instruction) return [];
        return [{
          instruction: step.maneuver.instruction,
          distanceMeters: Math.round(step.distance || 0),
          durationSeconds: Math.round(step.duration || 0),
          location: [location[1], location[0]] as LatLng,
          type: step.maneuver.type,
        }];
      }),
    );
    return {
      points: coords.map(([lon, lat]) => [lat, lon] as LatLng),
      distanceMeters: Math.round(route.distance || 0),
      durationSeconds: Math.round(route.duration || 0),
      source: 'mapbox',
      steps,
    };
  } catch {
    return null;
  }
};

const fetchOsrm = async (from: LatLng, to: LatLng, via: LatLng[] = []): Promise<RouteInfo | null> => {
  const coordinates = [from, ...via, to].map(([lat, lon]) => `${lon},${lat}`).join(';');
  const url = `${ROUTER_OSRM}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: Array<[number, number]> };
      }>;
    };
    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (data.code !== 'Ok' || !route || !coords || coords.length < 2) return null;
    return {
      points: coords.map(([lon, lat]) => [lat, lon] as LatLng),
      distanceMeters: Math.round(route.distance ?? 0),
      durationSeconds: Math.round(route.duration ?? 3000),
      source: 'osrm',
    };
  } catch {
    return null;
  }
};

export const useRoute = (from: LatLng | null, to: LatLng | null, via: LatLng[] = []) => {
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const viaKey = via.map(([lat, lon]) => `${lat},${lon}`).join(';');

  useEffect(() => {
    let active = true;
    // Réinitialise l'itinéraire quand les points de départ/arrivée changent pour éviter un trajet périmé.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoute(null);
    if (!from || !to) return undefined;

    setLoading(true);
    fetchMapbox(from, to, via).then((mapbox) => {
      if (!active) return;
      if (mapbox) {
        setRoute(mapbox);
        setLoading(false);
        return;
      }
      fetchOsrm(from, to, via).then((osrm) => {
        if (!active) return;
        setRoute(osrm || {
          points: [from, to],
          distanceMeters: 0,
          durationSeconds: 0,
          source: 'straight',
        });
        setLoading(false);
      });
    });

    return () => {
      active = false;
    };
  // Coordinates are the stable identity of a route; including array references would
  // refetch whenever a caller reconstructs an equivalent LatLng value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from?.[0], from?.[1], to?.[0], to?.[1], viaKey]);

  return { route, loading };
};

export const computeEta = (
  position: LatLng | null,
  lastPositionAt: string | undefined,
  route: RouteInfo | null,
): EtaInfo | null => {
  if (!position || !route || route.points.length < 2 || route.durationSeconds <= 0 || route.distanceMeters <= 0) return null;

  const idx = nearestPointIndex(position, route.points);
  const remainingMeters = remainingMetersFrom(idx, route.points);
  const remainingSeconds = route.durationSeconds * (remainingMeters / route.distanceMeters);
  const minutesRemaining = Math.max(1, Math.round(remainingSeconds / 60));

  const base = lastPositionAt ? new Date(lastPositionAt).getTime() : Date.now();
  const etaDate = new Date(base + remainingSeconds * 1000);
  const etaLabel = etaDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return {
    minutesRemaining,
    etaLabel,
    remainingKm: Math.round((remainingMeters / 1000) * 10) / 10,
  };
};

export const useDemoPosition = (
  enabled: boolean,
  speed: number,
  route: RouteInfo | null,
  onTick: (position: LatLng) => void,
) => {
  const [index, setIndex] = useState(0);

  const reset = useCallback(() => setIndex(0), []);

  useEffect(() => {
    if (!enabled || !route || route.points.length < 2) return undefined;
    // Remet l'index à zéro si le nouvel itinéraire est plus court que l'ancien.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex((current) => (current >= route.points.length - 2 ? 0 : current));
    const timer = window.setInterval(() => {
      setIndex((current) => {
        const next = current + 1;
        if (next >= route.points.length - 1) {
          return current;
        }
        return next;
      });
    }, Math.max(500, Math.round(1000 / speed)));
    return () => window.clearInterval(timer);
  }, [enabled, route, speed]);

  useEffect(() => {
    if (!enabled || !route || route.points.length < 2) return;
    onTick(route.points[index]);
  }, [enabled, route, index, onTick]);

  return { reset };
};