export type LatLng = [number, number];

const EARTH_RADIUS_M = 6371000;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

export const haversineMeters = (a: LatLng, b: LatLng): number => {
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

export const polylineLengthMeters = (points: LatLng[]): number => {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
};

export const nearestPointIndex = (position: LatLng, points: LatLng[]): number => {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const d = haversineMeters(position, points[i]);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  return best;
};

export const remainingMetersFrom = (index: number, points: LatLng[]): number => {
  let rest = 0;
  for (let i = index; i < points.length - 1; i += 1) {
    rest += haversineMeters(points[i], points[i + 1]);
  }
  return rest;
};

export const bearingDegrees = (a: LatLng, b: LatLng): number => {
  const dLon = toRad(b[1] - a[1]);
  const y = Math.sin(dLon) * Math.cos(toRad(b[0]));
  const x =
    Math.cos(toRad(a[0])) * Math.sin(toRad(b[0])) -
    Math.sin(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

export const formatDuration = (seconds: number): string => {
  const rounded = Math.max(1, Math.round(seconds / 60));
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return minutes ? `${hours} h ${String(minutes).padStart(2, '0')}` : `${hours} h`;
};