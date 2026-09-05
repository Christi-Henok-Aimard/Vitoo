import React, { useEffect, useState } from 'react';
import { MapPin, Building2, Clock, CreditCard, Users, Bus, Plus, X as XClose, Check as CheckMark, Eye, Navigation, ArrowLeft } from 'lucide-react';
import { getTripByIdApi, type TripData, type DriverData, type VehicleData, type TicketData } from '../../../api/companyApi';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { InputField, type CompanyBranding } from '../dashboardShared';
import { normalizePaymentMethods } from '../paymentMethods';
import type { TripFormPayload } from '../CompanyDashboard';

interface Props {
  trips: TripData[];
  drivers: DriverData[];
  vehicles: VehicleData[];
  initialTripId?: string | null;
  onAddTrip: (t: TripFormPayload) => Promise<void>;
  branding: CompanyBranding;
}

/* ==================== TRIPS TAB WITH LIVE TRACKING ==================== */
export const TripsTabFull: React.FC<Props> = ({ trips, drivers, vehicles, initialTripId, onAddTrip, branding }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(() => initialTripId ? trips.find((trip) => trip.id === initialTripId) ?? null : null);
  const [tripTickets, setTripTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ depart: '', arrivee: '', station: '', time: '', date: '', price: '', totalSeats: '', vehicleId: '', driverId: '', stops: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onAddTrip({
        depart: formData.depart,
        arrivee: formData.arrivee,
        station: formData.station,
        time: formData.time,
        date: formData.date,
        price: Number(formData.price),
        totalSeats: Number(formData.totalSeats),
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        paymentMethods: (() => { const m = normalizePaymentMethods(branding.paymentMethods); return m.length ? m : ['Espèces']; })(),
        stops: formData.stops.split(',').map(s => s.trim()).filter(Boolean),
      });
      setFormData({ depart: '', arrivee: '', station: '', time: '', date: '', price: '', totalSeats: '', vehicleId: '', driverId: '', stops: '' });
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTripDetails = async (tripId: string) => {
    try {
      const data = await getTripByIdApi(tripId);
      setSelectedTrip(data.trip);
      setTripTickets(data.tickets);
    } catch (err) {
      console.error('Erreur chargement trajet:', err);
    }
  };

  useEffect(() => {
    if (!initialTripId) return;
    getTripByIdApi(initialTripId).then((data) => setTripTickets(data.tickets)).catch((err) => console.error('Erreur chargement billets:', err));
  }, [initialTripId]);

  if (selectedTrip) {
    return <TripDetailView trip={selectedTrip} tickets={tripTickets} onBack={() => setSelectedTrip(null)} branding={branding} />;
  }

  return (
    <div className="fade-in">
      <div className="page-heading">
        <div>
          <span className="hero-eyebrow">Gestion</span>
          <h1>Mes trajets</h1>
          <p>Programmez et suivez vos départs en temps réel.</p>
        </div>
        <button className="primary-action" onClick={() => setShowForm(!showForm)} disabled={drivers.length === 0 || vehicles.length === 0}>
          {showForm ? <><XClose size={16} /> Annuler</> : <><Plus size={16} /> Programmer</>}
        </button>
      </div>

      {drivers.length === 0 || vehicles.length === 0 ? (
        <div className="alert-info">Ajoutez au moins un chauffeur et un véhicule dans votre profil pour programmer un trajet.</div>
      ) : null}

      {showForm && (
        <form onSubmit={handleAdd} className="form-card">
          <div className="form-grid">
            <InputField label="Ville de départ" value={formData.depart} onChange={(v) => setFormData({ ...formData, depart: v })} icon={<MapPin size={16} />} required />
            <InputField label="Ville d'arrivée" value={formData.arrivee} onChange={(v) => setFormData({ ...formData, arrivee: v })} icon={<MapPin size={16} />} required />
            <InputField label="Gare/Station" value={formData.station} onChange={(v) => setFormData({ ...formData, station: v })} icon={<Building2 size={16} />} required />
            <InputField label="Date" value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} type="date" icon={<Clock size={16} />} required />
            <InputField label="Heure" value={formData.time} onChange={(v) => setFormData({ ...formData, time: v })} type="time" icon={<Clock size={16} />} required />
            <InputField label="Prix (FCFA)" value={formData.price} onChange={(v) => setFormData({ ...formData, price: v })} type="number" icon={<CreditCard size={16} />} required min="1000" />
            <InputField label="Places (min. 10)" value={formData.totalSeats} onChange={(v) => setFormData({ ...formData, totalSeats: v })} type="number" icon={<Users size={16} />} required min="10" />
            <div className="form-field">
              <label className="field-label"><Users size={16} /> Chauffeur</label>
              <SearchableDropdown
                items={drivers.filter(d => d.status === 'available').map(d => ({ id: d.id, label: `${d.firstName} ${d.lastName}`, sublabel: d.phone }))}
                value={formData.driverId}
                onChange={(val) => setFormData({ ...formData, driverId: val })}
                placeholder="Rechercher un chauffeur..."
                searchPlaceholder="Nom ou téléphone..."
                emptyMessage="Aucun chauffeur"
              />
            </div>
            <div className="form-field">
              <label className="field-label"><Bus size={16} /> Véhicule</label>
              <SearchableDropdown
                items={vehicles.filter(v => v.status === 'available').map(v => ({ id: v.id, label: `${v.plate} - ${v.brand} ${v.model}`, sublabel: `${v.capacity} places` }))}
                value={formData.vehicleId}
                onChange={(val) => setFormData({ ...formData, vehicleId: val })}
                placeholder="Rechercher un véhicule..."
                searchPlaceholder="Plaque, marque..."
                emptyMessage="Aucun véhicule"
              />
            </div>
            <div className="form-field full-width">
              <label className="field-label">Escales (séparées par virgules)</label>
              <input className="field-input" value={formData.stops} onChange={(e) => setFormData({ ...formData, stops: e.target.value })} placeholder="Ex: Yamoussoukro, Bouaké" />
            </div>
          </div>
          <button type="submit" className="primary-action" disabled={isLoading}>
            {isLoading ? 'Programmation...' : <><CheckMark size={16} /> Programmer le trajet</>}
          </button>
        </form>
      )}

      {trips.length === 0 ? (
        <div className="empty-state"><Bus size={48} /><p>Aucun trajet programmé.</p></div>
      ) : (
        <div className="trips-grid">
          {trips.map((trip) => (
            <div key={trip.id} className="trip-card" onClick={() => loadTripDetails(trip.id)}>
              <div className="trip-card-header">
                <span className="trip-date">{trip.date}</span>
                <span className={`pill ${trip.status === 'scheduled' ? 'pill-blue' : trip.status === 'in_transit' ? 'pill-green' : 'pill-grey'}`}>
                  {trip.status === 'scheduled' ? 'En attente' : trip.status === 'in_transit' ? 'En cours' : 'Terminé'}
                </span>
              </div>
              <div className="trip-route">{trip.depart} → {trip.arrivee}</div>
              <div className="trip-meta"><Clock size={14} /> {trip.time} · {trip.station}</div>
              <div className="trip-card-footer">
                <span className="trip-price">{trip.price} FCFA</span>
                <span className="trip-seats">{trip.availableSeats}/{trip.totalSeats} places</span>
              </div>
              <div className="trip-card-action">
                <Eye size={14} /> Voir détails et suivi en direct
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ==================== TRIP DETAIL ==================== */
const TripDetailView: React.FC<{ trip: TripData; tickets: TicketData[]; onBack: () => void; branding: CompanyBranding }> = ({ trip, tickets, onBack, branding }) => {
  const [activeTab, setActiveTab] = useState<'passengers' | 'tracking'>('passengers');
  const hasPosition = typeof trip.latitude === 'number' && typeof trip.longitude === 'number';
  const boarded = tickets.filter((t) => t.status === 'used').length;
  const waiting = tickets.filter((t) => t.status === 'active').length;

  return (
    <div className="fade-in">
      <button onClick={onBack} className="back-link"><ArrowLeft size={16} /> Retour aux trajets</button>

      <div className="trip-detail-header" style={{ background: branding.primaryColor || '#2563eb' }}>
        <div className="trip-detail-info">
          <span className="trip-detail-status">
            {trip.status === 'in_transit' ? '🟢 En cours' : trip.status === 'scheduled' ? '🟡 En attente' : '⚪ Terminé'}
          </span>
          <h1>{trip.depart} → {trip.arrivee}</h1>
          <p>{trip.date} à {trip.time} · {trip.station}</p>
        </div>
        <div className="trip-detail-stats">
          <div className="trip-stat"><span>{trip.price} FCFA</span><small>Prix</small></div>
          <div className="trip-stat"><span>{trip.availableSeats}/{trip.totalSeats}</span><small>Places</small></div>
          <div className="trip-stat"><span>{tickets.length}</span><small>Passagers</small></div>
        </div>
      </div>

      <div className="detail-tabs">
        <button className={`detail-tab ${activeTab === 'passengers' ? 'active' : ''}`} onClick={() => setActiveTab('passengers')}>
          <Users size={16} /> Passagers
        </button>
        <button className={`detail-tab ${activeTab === 'tracking' ? 'active' : ''}`} onClick={() => setActiveTab('tracking')}>
          <Navigation size={16} /> Suivi GPS
        </button>
      </div>

      {activeTab === 'passengers' && (
        <div className="passengers-section">
          <div className="passenger-summary">
            <div className="passenger-summary-item"><span className="dot green" /> Montés: {boarded}</div>
            <div className="passenger-summary-item"><span className="dot orange" /> En attente: {waiting}</div>
          </div>
          {tickets.length === 0 ? (
            <div className="empty-state">Aucun passager.</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Siège</th><th>Passager</th><th>Téléphone</th><th>Statut</th><th>Paiement</th></tr></thead>
                <tbody>
                  {tickets.map((p) => (
                    <tr key={p.id}>
                      <td>{p.seatNumber || '—'}</td>
                      <td><strong>{p.passengerName}</strong></td>
                      <td>{p.passengerPhone}</td>
                      <td>
                        <span className={`pill ${p.status === 'used' ? 'pill-green' : p.status === 'cancelled' ? 'pill-grey' : 'pill-orange'}`}>
                          {p.status === 'used' ? 'Monté' : p.status === 'cancelled' ? 'Annulé' : 'En attente'}
                        </span>
                      </td>
                      <td>{p.paymentMethod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="tracking-section">
          {hasPosition ? (
            <>
              <div className="tracking-map">
                <div className="map-placeholder">
                  <Navigation size={32} />
                  <p>Position en direct du véhicule</p>
                  <small>Lat: {trip.latitude?.toFixed(4)}, Lng: {trip.longitude?.toFixed(4)}</small>
                  <div className="map-route-line" />
                  <div className="map-marker start"><MapPin size={16} /> {trip.depart}</div>
                  <div className="map-marker end"><MapPin size={16} /> {trip.arrivee}</div>
                </div>
              </div>
              <div className="tracking-info">
                <div className="tracking-info-item"><MapPin size={16} /> Dernière position : {trip.lastPositionAt ? new Date(trip.lastPositionAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'récemment'}</div>
                <div className="tracking-info-item"><Users size={16} /> {tickets.length} billet(s) vendu(s) · {boarded} embarqué(s)</div>
              </div>
            </>
          ) : (
            <div className="map-placeholder">
              <Navigation size={32} />
              <p>Aucune position reçue pour le moment.</p>
              <small>La position apparaîtra ici dès que le chauffeur activera le suivi GPS depuis son application.</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


