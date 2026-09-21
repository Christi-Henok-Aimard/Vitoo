import React, { useMemo, useState } from 'react';
import { Bus, MapPin, Navigation, Radio, Clock } from 'lucide-react';
import { LiveMap } from '../../../shared/maps/LiveMap';
import type { TripData } from '../../../api/companyApi';

interface TrackingTabProps {
  trips: TripData[];
}

const STATUS_LABEL: Record<TripData['status'], { label: string; css: string }> = {
  scheduled: { label: 'Programmé', css: 'pill-grey' },
  boarding: { label: 'Embarquement', css: 'pill-amber' },
  in_transit: { label: 'En route', css: 'pill-green' },
  completed: { label: 'Terminé', css: 'pill-grey' },
  cancelled: { label: 'Annulé', css: 'pill-red' },
};

const hasPosition = (trip: TripData): boolean =>
  typeof trip.latitude === 'number' && typeof trip.longitude === 'number' &&
  Number.isFinite(trip.latitude) && Number.isFinite(trip.longitude);

export const TrackingTab: React.FC<TrackingTabProps> = ({ trips }) => {
  const active = useMemo(
    () => trips.filter((t) => t.status === 'boarding' || t.status === 'in_transit'),
    [trips],
  );
  const upcoming = useMemo(() => trips.filter((t) => t.status === 'scheduled'), [trips]);
  const live = useMemo(() => active.filter(hasPosition), [active]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = active.find((t) => t.id === selectedId) ?? active[0] ?? upcoming[0] ?? trips[0] ?? null;
  const selectedLive = selected ? live.find((t) => t.id === selected.id) ?? null : null;

  const vehicles = useMemo(
    () => live.map((t, index) => ({
      id: t.id,
      label: `${t.depart.slice(0, 8)}→${t.arrivee.slice(0, 8)}`,
      lat: t.latitude as number,
      lon: t.longitude as number,
      lastPositionAt: t.lastPositionAt,
      color: index % 2 === 0 ? '#1d5df5' : '#0d8a6a',
    })),
    [live],
  );

  const zoomTo = useMemo<[number, number] | null>(() => {
    if (!selected) return null;
    if (hasPosition(selected)) return [selected.latitude as number, selected.longitude as number];
    return null;
  }, [selected]);

  const lastSeen = (trip: TripData): string => {
    if (!trip.lastPositionAt) return '—';
    const d = new Date(trip.lastPositionAt);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  return (
    <div className="fade-in">
      <div className="page-heading">
        <span className="hero-eyebrow"><Radio size={14} /> Flotte en temps réel</span>
        <h1>Suivi de flotte</h1>
        <p>Vos cars en mouvement, leur position GPS et leur arrivée estimée en direct.</p>
      </div>

      <div className="company-stats-chips" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', margin: '0.75rem 0 1.25rem' }}>
        <span className="pill pill-green"><Navigation size={14} /> {live.length} car{live.length > 1 ? 's' : ''} en direct</span>
        <span className="pill pill-amber"><Bus size={14} /> {active.length} trajet{active.length > 1 ? 's' : ''} actif{active.length > 1 ? 's' : ''}</span>
        <span className="pill pill-grey"><Clock size={14} /> {upcoming.length} à venir</span>
      </div>

      <LiveMap
        from={selected ? { city: selected.depart } : null}
        to={selected ? { city: selected.arrivee } : null}
        vehicles={vehicles.length > 0 ? vehicles : null}
        height={420}
        zoomTo={zoomTo}
        onVehicleClick={(id) => id && setSelectedId(id)}
      />

      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '0.6rem', color: 'var(--vitoo-ink, #10233f)' }}>Trajets en cours</h3>
        {active.length === 0 ? (
          <p className="empty-state">Aucun trajet en cours. Lancez la mission depuis l'onglet Trajets pour voir le car bouger ici.</p>
        ) : (
          <div className="trip-card-list" style={{ display: 'grid', gap: '0.6rem' }}>
            {active.map((trip) => {
              const info = STATUS_LABEL[trip.status];
              const isLive = hasPosition(trip);
              return (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => setSelectedId(trip.id)}
                  style={{
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.8rem 1rem', borderRadius: 14, font: 'inherit',
                    border: `1px solid ${selected?.id === trip.id ? '#1d5df5' : 'var(--vitoo-border, #e2e8f0)'}`,
                    background: 'var(--vitoo-surface, #fff)', cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eef3ff', display: 'grid', placeItems: 'center', color: '#1d5df5' }}>
                    <Bus size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <b style={{ color: 'var(--vitoo-ink, #10233f)' }}>{trip.depart} → {trip.arrivee}</b>
                    <small style={{ display: 'block', color: 'var(--vitoo-text-soft, #77869c)' }}>Départ {trip.time} · {trip.availableSeats}/{trip.totalSeats} places</small>
                  </div>
                  <span className={`pill ${info.css}`}>{info.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 800, color: isLive ? '#0d8a6a' : 'var(--vitoo-text-soft, #77869c)' }}>
                    <MapPin size={14} /> {isLive ? `GPS · ${lastSeen(trip)}` : 'GPS en attente'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selected && selectedLive && (
          <div style={{ marginTop: '0.9rem', padding: '0.9rem 1.1rem', borderRadius: 14, border: '1px solid var(--vitoo-border, #e2e8f0)', background: 'var(--vitoo-surface-2, #f8fafc)' }}>
            <strong style={{ color: 'var(--vitoo-ink, #10233f)' }}>{selected.depart} → {selected.arrivee}</strong>
            <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--vitoo-text-soft, #77869c)' }}>
              Position mise à jour à {lastSeen(selected)} — cliquez sur le marqueur de la carte ou sur un trajet pour le centrer.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};