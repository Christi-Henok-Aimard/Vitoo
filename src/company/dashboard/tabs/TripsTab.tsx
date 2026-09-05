import React, { useState } from 'react';
import { addTripApi, getTripByIdApi, type TripData, type DriverData, type VehicleData, type TicketData } from '../../../api/companyApi';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { normalizePaymentMethods } from '../paymentMethods';

interface Props {
  trips: TripData[];
  drivers: DriverData[];
  vehicles: VehicleData[];
}

export const TripsTab: React.FC<Props> = ({ trips, drivers, vehicles }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);
  const [tripTickets, setTripTickets] = useState<TicketData[]>([]);
  const [formData, setFormData] = useState({ depart: '', arrivee: '', station: '', time: '', date: '', price: '', totalSeats: '', vehicleId: '', driverId: '', stops: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await addTripApi({
        depart: formData.depart,
        arrivee: formData.arrivee,
        station: formData.station,
        time: formData.time,
        date: formData.date,
        price: Number(formData.price),
        totalSeats: Number(formData.totalSeats),
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        paymentMethods: (() => { const m = normalizePaymentMethods(JSON.parse(localStorage.getItem('vitoo_company_branding') || '{}').paymentMethods); return m.length ? m : ['Wave', 'Orange Money', 'MTN MoMo']; })(),
        stops: formData.stops.split(',').map(s => s.trim()).filter(Boolean),
      });
      setFormData({ depart: '', arrivee: '', station: '', time: '', date: '', price: '', totalSeats: '', vehicleId: '', driverId: '', stops: '' });
      setShowForm(false);
      window.location.reload();
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

  if (selectedTrip) {
    return (
      <div>
        <button onClick={() => setSelectedTrip(null)} className="back-link">← Retour aux trajets</button>
        <div className="page-heading">
          <span className="hero-eyebrow">Détail du trajet</span>
          <h1>{selectedTrip.depart} → {selectedTrip.arrivee}</h1>
          <p>{selectedTrip.date} à {selectedTrip.time} — {selectedTrip.station}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-sm text-slate-500">Prix</div>
            <div className="text-2xl font-black text-vitoo-blue">{selectedTrip.price} FCFA</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-sm text-slate-500">Places</div>
            <div className="text-2xl font-black text-vitoo-blue">{selectedTrip.availableSeats}/{selectedTrip.totalSeats}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-sm text-slate-500">Billets vendus</div>
            <div className="text-2xl font-black text-green-600">{tripTickets.length}</div>
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-3">Passagers</h3>
        {tripTickets.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <p className="text-slate-500">Aucun billet vendu.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-bold text-slate-600">Passager</th>
                  <th className="text-left p-3 font-bold text-slate-600">Téléphone</th>
                  <th className="text-left p-3 font-bold text-slate-600">Siège</th>
                  <th className="text-left p-3 font-bold text-slate-600">Montant</th>
                  <th className="text-left p-3 font-bold text-slate-600">Canal</th>
                </tr>
              </thead>
              <tbody>
                {tripTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-100">
                    <td className="p-3 font-bold">{ticket.passengerName}</td>
                    <td className="p-3">{ticket.passengerPhone}</td>
                    <td className="p-3">{ticket.seatNumber}</td>
                    <td className="p-3">{ticket.amount} FCFA</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${ticket.soldBy === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {ticket.soldBy === 'online' ? 'En ligne' : 'Guichet'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-heading flex items-center justify-between">
        <div>
          <span className="hero-eyebrow">Gestion</span>
          <h1>Mes trajets</h1>
          <p>Programmez et gérez vos départs.</p>
        </div>
        <button className="primary-action max-w-xs" onClick={() => setShowForm(!showForm)} disabled={drivers.length === 0 || vehicles.length === 0}>
          {showForm ? 'Annuler' : '+ Programmer un trajet'}
        </button>
      </div>

      {drivers.length === 0 || vehicles.length === 0 ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <p className="text-orange-700 text-sm">Vous devez ajouter au moins un chauffeur et un véhicule avant de programmer un trajet.</p>
        </div>
      ) : null}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Ville de départ</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.depart} onChange={e => setFormData({ ...formData, depart: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Ville d'arrivée</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.arrivee} onChange={e => setFormData({ ...formData, arrivee: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Gare/Station</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.station} onChange={e => setFormData({ ...formData, station: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Date</span>
              <input required type="date" className="border border-slate-300 rounded-lg px-3 py-2" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Heure</span>
              <input required type="time" className="border border-slate-300 rounded-lg px-3 py-2" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Prix (FCFA)</span>
              <input required type="number" className="border border-slate-300 rounded-lg px-3 py-2" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Places</span>
              <input required type="number" className="border border-slate-300 rounded-lg px-3 py-2" value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Chauffeur</span>
              <SearchableDropdown
                items={drivers.filter(d => d.status === 'available').map(d => ({
                  id: d.id,
                  label: `${d.firstName} ${d.lastName}`,
                  sublabel: d.phone,
                }))}
                value={formData.driverId}
                onChange={(val) => setFormData({ ...formData, driverId: val })}
                placeholder="Rechercher un chauffeur..."
                searchPlaceholder="Nom ou téléphone..."
                emptyMessage="Aucun chauffeur disponible"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Véhicule</span>
              <SearchableDropdown
                items={vehicles.filter(v => v.status === 'available').map(v => ({
                  id: v.id,
                  label: `${v.plate} - ${v.brand} ${v.model}`,
                  sublabel: `${v.capacity} places`,
                }))}
                value={formData.vehicleId}
                onChange={(val) => setFormData({ ...formData, vehicleId: val })}
                placeholder="Rechercher un véhicule..."
                searchPlaceholder="Plaque, marque..."
                emptyMessage="Aucun véhicule disponible"
              />
            </label>
            <label className="grid gap-1 col-span-2">
              <span className="text-sm font-bold text-slate-600">Escales (séparées par des virgules)</span>
              <input className="border border-slate-300 rounded-lg px-3 py-2" value={formData.stops} onChange={e => setFormData({ ...formData, stops: e.target.value })} placeholder="Ex: Yamoussoukro, Bouaké" />
            </label>
          </div>
          <button type="submit" className="primary-action max-w-xs mt-4" disabled={isLoading}>
            {isLoading ? 'Programmation...' : 'Programmer le trajet'}
          </button>
        </form>
      )}

      {trips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">Aucun trajet programmé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm cursor-pointer hover:border-vitoo-blue" onClick={() => loadTripDetails(trip.id)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-500">{trip.date}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${trip.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : trip.status === 'in_transit' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                  {trip.status === 'scheduled' ? 'Programmé' : trip.status === 'in_transit' ? 'En cours' : 'Terminé'}
                </span>
              </div>
              <div className="text-lg font-black text-slate-800">{trip.depart} → {trip.arrivee}</div>
              <div className="text-sm text-slate-600">{trip.time} — {trip.station}</div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <span className="text-sm font-bold text-vitoo-blue">{trip.price} FCFA</span>
                <span className="text-sm text-slate-500">{trip.availableSeats}/{trip.totalSeats} places</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
