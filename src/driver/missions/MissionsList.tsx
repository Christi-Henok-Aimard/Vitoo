import React from 'react';
import { CalendarDays, Clock3, MapPin, Route, Users } from 'lucide-react';
import type { TripData } from '../../api/driverApi';

const statusPill = (status: TripData['status']) => {
  switch (status) {
    case 'boarding': return <span className="pill pill-orange">Embarquement</span>;
    case 'in_transit': return <span className="pill pill-green">En route</span>;
    case 'completed': return <span className="pill pill-grey">Terminé</span>;
    case 'cancelled': return <span className="pill pill-grey">Annulé</span>;
    default: return <span className="pill pill-blue">Programmé</span>;
  }
};

const formatDate = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

export const MissionsList: React.FC<{ trips: TripData[]; loading: boolean; onSelect: (trip: TripData) => void }> = ({ trips, loading, onSelect }) => {
  const upcoming = trips.filter((t) => !['completed', 'cancelled'].includes(t.status));
  const finished = trips.filter((t) => ['completed', 'cancelled'].includes(t.status));

  const Card: React.FC<{ trip: TripData }> = ({ trip }) => (
    <button type="button" className="trip-card-driver" onClick={() => onSelect(trip)}>
      <div className="trip-card-driver-header">
        <div>
          <div className="trip-route">{trip.depart} → {trip.arrivee}</div>
          <span className="trip-meta"><CalendarDays /> {formatDate(trip.date)}</span>
          <span className="trip-meta"><Clock3 /> {trip.time}</span>
        </div>
        {statusPill(trip.status)}
      </div>
      {trip.company && <span className="trip-meta"><Route /> {trip.company}</span>}
      <div className="trip-card-driver-footer">
        <span>{trip.station}</span>
        <span>{trip.availableSeats}/{trip.totalSeats} places</span>
        <span>{trip.price.toLocaleString('fr-FR')} FCFA</span>
      </div>
      {trip.vehicle?.plate && (
        <span className="trip-meta"><MapPin /> Véhicule {trip.vehicle.plate} · {trip.vehicle.brand || ''} {trip.vehicle.model || ''}</span>
      )}
    </button>
  );

  return (
    <div className="fade-in">
      <div className="page-heading">
        <span className="hero-eyebrow">Espace chauffeur</span>
        <h1>Mes missions</h1>
        <p>Les trajets que votre compagnie vous a assignés. Cliquez sur une mission pour voir les passagers et embarquer.</p>
      </div>

      {loading && trips.length === 0 ? (
        <div className="loading-state"><div className="loading-spinner" /></div>
      ) : upcoming.length === 0 && finished.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p>Aucune mission pour le moment</p>
          <p>Dès que votre compagnie publie une ligne et vous l'assigne, elle apparaîtra ici automatiquement.</p>
        </div>
      ) : (
        <>
          <h3 className="section-title">En cours / à venir ({upcoming.length})</h3>
          <div className="trips-list">
            {upcoming.length === 0 ? <p className="empty-state">Aucune mission en cours ou à venir.</p> : upcoming.map((trip) => <Card key={trip.id} trip={trip} />)}
          </div>
          {finished.length > 0 && (
            <>
              <h3 className="section-title">Terminées ({finished.length})</h3>
              <div className="trips-list">
                {finished.map((trip) => <Card key={trip.id} trip={trip} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};