import React, { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DEFAULT_CENTER, resolveCity } from './cities';
import type { LatLng } from './geolib';
import { useRoute } from './useRoute';
import type { FleetVehicle, LiveMapProps, MapPointInput } from './LiveMap';

const pointToLatLng = (point: MapPointInput | null | undefined): LatLng | null => {
  if (!point) return null;
  if (typeof point.lat === 'number' && typeof point.lon === 'number') return [point.lat, point.lon];
  const city = resolveCity(point.city);
  return city ? [city.lat, city.lon] : null;
};

const markerElement = (color: string, label?: string): HTMLDivElement => {
  const element = document.createElement('div');
  element.style.cssText = `width:${label ? 'auto' : '18px'};height:18px;padding:${label ? '5px 8px' : '0'};border-radius:999px;background:${color};border:3px solid white;box-shadow:0 2px 8px #0006;color:white;font:700 11px sans-serif;white-space:nowrap`;
  if (label) element.textContent = label;
  return element;
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);

interface MapboxLiveMapProps extends LiveMapProps {
  token: string;
}

export const MapboxLiveMap: React.FC<MapboxLiveMapProps> = ({ token, from, to, stops, vehicle, vehicles, height = 320, className, zoomTo, precomputedRoute }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const fromPoint = useMemo(() => pointToLatLng(from), [from]);
  const toPoint = useMemo(() => pointToLatLng(to), [to]);
  const stopPoints = useMemo(() => (stops || []).map(pointToLatLng).filter((point): point is LatLng => point !== null), [stops]);
  const via = stopPoints.length > 2 ? stopPoints.slice(1, -1) : [];
  const internalRoute = useRoute(fromPoint, toPoint, via);
  const route = precomputedRoute !== undefined ? precomputedRoute : internalRoute.route;
  const fleet = useMemo(() => (vehicles || []).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon)), [vehicles]);
  const vehiclePoint = fleet.length ? null : pointToLatLng(vehicle);

  useEffect(() => {
    mapboxgl.accessToken = token;
    if (!containerRef.current || mapRef.current) return undefined;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: import.meta.env.VITE_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12',
      center: [DEFAULT_CENTER[1], DEFAULT_CENTER[0]],
      zoom: 7,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    const handleMapClick = async (event: mapboxgl.MapMouseEvent): Promise<void> => {
      const { lng, lat } = event.lngLat;
      const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: false })
        .setLngLat([lng, lat])
        .setHTML('<div style="min-width:160px">Recherche du lieu...</div>')
        .addTo(map);
      popupRef.current?.remove();
      popupRef.current = popup;
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(`${lng},${lat}`)}.json?language=fr&limit=1&access_token=${encodeURIComponent(token)}`,
        );
        if (!response.ok) throw new Error(`Mapbox geocoding failed (${response.status})`);
        const data = (await response.json()) as { features?: Array<{ place_name?: string; text?: string; properties?: { address?: string } }> };
        const feature = data.features?.[0];
        const placeName = escapeHtml(feature?.place_name || feature?.text || 'Lieu non identifié');
        if (popupRef.current === popup) {
          popup.setHTML(
            `<div style="min-width:180px"><strong>${placeName}</strong><br><small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small></div>`,
          );
        }
      } catch {
        if (popupRef.current === popup) {
          popup.setHTML(
            `<div style="min-width:180px"><strong>Lieu non identifié</strong><br><small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small></div>`,
          );
        }
      }
    };
    map.on('click', handleMapClick);
    mapRef.current = map;
    return () => {
      map.off('click', handleMapClick);
      popupRef.current?.remove();
      popupRef.current = null;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route) return;
    const draw = () => {
      const source = map.getSource('vitoo-route') as mapboxgl.GeoJSONSource | undefined;
      const data = {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: route.points.map(([lat, lon]) => [lon, lat]) },
      };
      if (source) source.setData(data);
      else {
        map.addSource('vitoo-route', { type: 'geojson', data });
        map.addLayer({ id: 'vitoo-route-line', type: 'line', source: 'vitoo-route', paint: { 'line-color': '#1d5df5', 'line-width': 5, 'line-opacity': 0.85 } });
      }
      const bounds = new mapboxgl.LngLatBounds();
      route.points.forEach(([lat, lon]) => bounds.extend([lon, lat]));
      if (vehiclePoint) bounds.extend([vehiclePoint[1], vehiclePoint[0]]);
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 48, duration: 600 });
    };
    if (map.isStyleLoaded()) draw();
    else map.once('load', draw);
  }, [route, vehiclePoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const add = (point: LatLng, color: string, label?: string) => {
      const marker = new mapboxgl.Marker({ element: markerElement(color, label) }).setLngLat([point[1], point[0]]).addTo(map);
      markersRef.current.push(marker);
    };
    if (fromPoint) add(fromPoint, '#0d8a6a');
    if (toPoint) add(toPoint, '#f06464');
    stopPoints.slice(1, -1).forEach((point) => add(point, '#f4b53d'));
    fleet.forEach((item: FleetVehicle) => add([item.lat, item.lon], item.color || '#1d5df5', item.label || item.id));
    if (vehiclePoint) add(vehiclePoint, '#1d5df5');
  }, [fromPoint, toPoint, stopPoints, fleet, vehiclePoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && zoomTo) map.flyTo({ center: [zoomTo[1], zoomTo[0]], zoom: 15, duration: 1000 });
  }, [zoomTo]);

  return <div style={{ position: 'relative', width: '100%', height }}><div ref={containerRef} className={className} style={{ width: '100%', height: '100%', borderRadius: 16 }} /></div>;
};
