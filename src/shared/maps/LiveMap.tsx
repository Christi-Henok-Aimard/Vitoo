import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_CENTER, resolveCity } from './cities';
import type { LatLng } from './geolib';
import { bearingDegrees } from './geolib';
import { computeEta, useRoute, type EtaInfo, type RouteInfo } from './useRoute';

export interface MapPointInput {
  city?: string | null;
  lat?: number | null;
  lon?: number | null;
}

export interface FleetVehicle {
  id: string;
  label?: string;
  lat: number;
  lon: number;
  lastPositionAt?: string;
  color?: string;
}

export interface LiveMapProps {
  from?: MapPointInput | null;
  to?: MapPointInput | null;
  stops?: MapPointInput[] | null;
  vehicle?: MapPointInput & { lastPositionAt?: string } | null;
  vehicles?: FleetVehicle[] | null;
  onVehicleClick?: (vehicleId?: string) => void;
  height?: number | string;
  className?: string;
  zoomTo?: [number, number] | null;
  precomputedRoute?: RouteInfo | null;
}

const pointToLatLng = (point: MapPointInput | null | undefined): LatLng | null => {
  if (!point) return null;
  if (typeof point.lat === 'number' && typeof point.lon === 'number' && Number.isFinite(point.lat) && Number.isFinite(point.lon)) {
    return [point.lat, point.lon];
  }
  const resolved = resolveCity(point.city);
  return resolved ? [resolved.lat, resolved.lon] : null;
};

const divIcon = (html: string, className: string): L.DivIcon =>
  L.divIcon({
    className,
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });

const START_ICON = divIcon(
  '<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#0d8a6a;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"><span style="width:8px;height:8px;border-radius:50%;background:#fff;transform:rotate(45deg)"></span></span>',
  'vitoo-marker-start',
);
const END_ICON = divIcon(
  '<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#f06464;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"><span style="width:8px;height:8px;border-radius:50%;background:#fff;transform:rotate(45deg)"></span></span>',
  'vitoo-marker-end',
);
const STOP_ICON = divIcon(
  '<span style="display:block;width:12px;height:12px;border-radius:50%;background:#f4b53d;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></span>',
  'vitoo-marker-stop',
);

const vehicleIcon = (bearing: number): L.DivIcon =>
  divIcon(
    `<span style="display:block;transform:rotate(${bearing}deg)"><svg viewBox="0 0 24 24" width="20" height="20" fill="#1d5df5" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))"><path d="M12 2c-2.7 4.5-4 7.6-4 10a4 4 0 0 0 8 0c0-2.4-1.3-5.5-4-10Z"/></svg><span style="display:block;width:8px;height:8px;border-radius:50%;background:#1d5df5;border:2.5px solid #fff;margin:-14px auto 0;box-shadow:0 1px 4px rgba(0,0,0,.3)"></span></span>`,
    'vitoo-marker-vehicle',
  );

const fleetIcon = (label: string, color: string): L.DivIcon =>
  divIcon(
    `<span style="display:flex;align-items:center;justify-content:center;min-width:28px;padding:0 .35rem;height:30px;border-radius:999px;background:${color};border:2.5px solid #fff;color:#fff;font-size:.68rem;font-weight:900;transform:translateY(26px);box-shadow:0 3px 8px rgba(0,0,0,.4);white-space:nowrap"><span style="display:block;width:8px;height:8px;border-radius:50%;background:#fff;margin-right:.25rem"></span>${label || 'Car'}</span>`,
    'vitoo-marker-fleet',
  );

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; OpenStreetMap';

export const LiveMap: React.FC<LiveMapProps> = ({
  from,
  to,
  stops,
  vehicle,
  vehicles,
  onVehicleClick,
  height = 320,
  className,
  zoomTo,
  precomputedRoute,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const fleetMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const vehicleHeadingRef = useRef<number>(0);
  const previousPositionRef = useRef<LatLng | null>(null);
  const fittedRef = useRef(false);

  const fromLatLng = useMemo(() => pointToLatLng(from ?? null), [from?.city, from?.lat, from?.lon]);
  const toLatLng = useMemo(() => pointToLatLng(to ?? null), [to?.city, to?.lat, to?.lon]);
  const stopLatLngs = useMemo(
    () => (stops ?? []).map((stop) => pointToLatLng(stop)).filter((p): p is LatLng => p !== null),
    [stops],
  );

  const fleet = useMemo(() => (vehicles ?? []).filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lon)), [vehicles]);

  const internalRoute = useRoute(fromLatLng, toLatLng);
  const route = precomputedRoute !== undefined ? precomputedRoute : internalRoute.route;

  const vehiclePosition: LatLng | null = useMemo(() => {
    if (fleet.length > 0) return null;
    const p = pointToLatLng(vehicle ?? null);
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.lat, vehicle?.lon, vehicle?.city, fleet.length]);

  const eta: EtaInfo | null = useMemo(
    () => computeEta(vehiclePosition && !fleet.length ? vehiclePosition : null, vehicle?.lastPositionAt, route),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vehiclePosition?.[0], vehiclePosition?.[1], route, fleet.length],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: DEFAULT_CENTER,
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      fittedRef.current = false;
      previousPositionRef.current = null;
      markersRef.current = L.layerGroup();
      vehicleMarkerRef.current = null;
      fleetMarkersRef.current = new Map();
      routeLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const group = markersRef.current;
    group.clearLayers();

    const start = pointToLatLng(from ?? null);
    const end = pointToLatLng(to ?? null);

    if (start) L.marker(start, { icon: START_ICON }).addTo(group);
    if (end) L.marker(end, { icon: END_ICON }).addTo(group);
    for (const stop of stopLatLngs) {
      L.marker(stop, { icon: STOP_ICON }).addTo(group);
    }

    if (fleet.length > 0) {
      fleetMarkersRef.current = new Map();
      for (const f of fleet) {
        const marker = L.marker([f.lat, f.lon], {
          icon: fleetIcon(f.label || f.id, f.color || '#1d5df5'),
          zIndexOffset: 900,
        }).addTo(group);
        marker.on('click', () => onVehicleClick?.(f.id));
        fleetMarkersRef.current.set(f.id, marker);
      }
      if (!fittedRef.current) {
        const bounds = L.latLngBounds(fleet.map((f) => [f.lat, f.lon] as LatLng));
        map.fitBounds(bounds.pad(0.25));
        fittedRef.current = true;
      }
      return;
    }

    if (vehiclePosition) {
      vehicleMarkerRef.current = L.marker(vehiclePosition, { icon: vehicleIcon(vehicleHeadingRef.current), zIndexOffset: 1000 }).addTo(group);
      vehicleMarkerRef.current.on('click', () => onVehicleClick?.());
    }
  }, [fromLatLng, toLatLng, stopLatLngs, vehiclePosition, fleet]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    if (!route || fleet.length > 0) return;

    const polyline = L.polyline(route.points, {
      color: '#1d5df5',
      weight: 5,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeLayerRef.current = polyline;

    if (!fittedRef.current) {
      const bounds = L.latLngBounds(route.points);
      if (vehiclePosition) bounds.extend(vehiclePosition);
      map.fitBounds(bounds.pad(0.18));
      fittedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, vehiclePosition?.[0], vehiclePosition?.[1], fleet.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (fleet.length > 0) {
      if (!map) return;
      for (const f of fleet) {
        const marker = fleetMarkersRef.current.get(f.id);
        if (!marker) continue;
        marker.setLatLng([f.lat, f.lon]);
      }
      return;
    }

    const marker = vehicleMarkerRef.current;
    if (!map || !marker || !vehiclePosition) return;

    marker.setLatLng(vehiclePosition);
    const previous = previousPositionRef.current;
    if (previous) {
      vehicleHeadingRef.current = bearingDegrees(previous, vehiclePosition);
      marker.setIcon(vehicleIcon(vehicleHeadingRef.current));
    }
    previousPositionRef.current = vehiclePosition;

    map.panTo(vehiclePosition, { animate: true, duration: 0.6 });
  }, [vehiclePosition?.[0], vehiclePosition?.[1]]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !zoomTo) return;
    map.flyTo(zoomTo, 15, { duration: 1.2 });
  }, [zoomTo?.[0], zoomTo?.[1]]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', borderRadius: 16, zIndex: 0 }} />
      <div className="vitoo-map-chip">
        {fleet.length > 0
          ? `Suivi de flotte · ${fleet.length} car${fleet.length > 1 ? 's' : ''} en direct`
          : vehiclePosition
            ? `En direct · ETA ${eta?.etaLabel ?? '—'} · ${eta?.remainingKm ?? '—'} km`
            : 'En attente de la position GPS…'}
      </div>
      {vehiclePosition && eta && (
        <div className="vitoo-map-eta">
          <strong>{eta.minutesRemaining} min</strong>
          <span>arrivée vers {eta.etaLabel}</span>
        </div>
      )}
    </div>
  );
};

export default LiveMap;