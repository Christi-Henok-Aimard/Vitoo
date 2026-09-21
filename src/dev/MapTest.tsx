import React, { useState } from 'react';
import { LiveMap } from '../shared/maps/LiveMap';
import { useRoute, useDemoPosition } from '../shared/maps/useRoute';
import { resolveCity } from '../shared/maps/cities';

export const MapTest: React.FC = () => {
  const from = resolveCity('Abidjan');
  const to = resolveCity('Yamoussoukro');
  const fromLL = from ? ([from.lat, from.lon] as [number, number]) : null;
  const toLL = to ? ([to.lat, to.lon] as [number, number]) : null;
  const { route } = useRoute(fromLL, toLL);

  const [pos, setPos] = useState<[number, number] | null>(null);
  const [tick, setTick] = useState(0);
  useDemoPosition(true, 3, route, (point) => {
    setPos(point);
    setTick((t) => t + 1);
  });

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '2rem 1rem', display: 'grid', gap: '1.5rem' }}>
      <h1>Test des cartes LiveMap</h1>

      <div>
        <h3>Trajet simple chauffeur/passager</h3>
        <LiveMap from={{ city: 'Abidjan' }} to={{ city: 'Yamoussoukro' }} vehicle={{ lat: pos?.[0], lon: pos?.[1], lastPositionAt: new Date().toISOString() }} precomputedRoute={route} height={380} />
        <p>tick={tick} routePoints={route?.points.length ?? 0}</p>
      </div>

      <div>
        <h3>Flotte compagnie</h3>
        <LiveMap
          vehicles={[
            { id: 'a', label: 'Abidjan→Bouaké', lat: 6.44, lon: -4.4 },
            { id: 'b', label: 'Abidjan→Daloa', lat: 6.87, lon: -5.85 },
            { id: 'c', label: 'Yamoussoukro→Korhogo', lat: 7.2, lon: -5.05 },
          ]}
          height={380}
        />
      </div>
    </div>
  );
};