import React, { useState } from 'react';
import { sellTicketApi, type TripData } from '../../../api/companyApi';

interface Props {
  trips: TripData[];
  onRefresh: () => void;
}

export const TicketsTab: React.FC<Props> = ({ trips, onRefresh }) => {
  const [formData, setFormData] = useState({ tripId: '', passengerName: '', passengerPhone: '', paymentMethod: 'Wave' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sellTicketApi({
        tripId: formData.tripId,
        passengerName: formData.passengerName,
        passengerPhone: formData.passengerPhone,
        paymentMethod: formData.paymentMethod,
        soldBy: 'counter',
      });
      setFormData({ tripId: '', passengerName: '', passengerPhone: '', paymentMethod: 'Wave' });
      onRefresh();
      alert('Billet vendu avec succès !');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTrip = trips.find(t => t.id === formData.tripId);

  return (
    <div>
      <div className="page-heading">
        <span className="hero-eyebrow">Ventes</span>
        <h1>Guichet</h1>
        <p>Vendez des billets aux passagers à la gare.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-2xl">
        <form onSubmit={handleSell} className="space-y-4">
          <label className="grid gap-1">
            <span className="text-sm font-bold text-slate-600">Trajet</span>
            <select required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.tripId} onChange={e => setFormData({ ...formData, tripId: e.target.value })}>
              <option value="">Sélectionner un trajet</option>
              {trips.filter(t => t.status === 'scheduled' && t.availableSeats > 0).map(t => (
                <option key={t.id} value={t.id}>{t.depart} → {t.arrivee} ({t.date} {t.time}) - {t.price} FCFA</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Nom du passager</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.passengerName} onChange={e => setFormData({ ...formData, passengerName: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Téléphone</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.passengerPhone} onChange={e => setFormData({ ...formData, passengerPhone: e.target.value })} />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-sm font-bold text-slate-600">Mode de paiement</span>
            <select className="border border-slate-300 rounded-lg px-3 py-2" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
              <option value="Wave">Wave</option>
              <option value="Orange Money">Orange Money</option>
              <option value="MTN MoMo">MTN MoMo</option>
              <option value="Espèces">Espèces</option>
            </select>
          </label>
          {selectedTrip && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-slate-500">Prix:</span> <span className="font-bold">{selectedTrip.price} FCFA</span></div>
                <div><span className="text-slate-500">Commission (8%):</span> <span className="font-bold text-orange-600">{Math.round(selectedTrip.price * 0.08)} FCFA</span></div>
                <div><span className="text-slate-500">Net compagnie:</span> <span className="font-bold text-green-600">{Math.round(selectedTrip.price * 0.92)} FCFA</span></div>
              </div>
            </div>
          )}
          <button type="submit" className="primary-action" disabled={isLoading}>
            {isLoading ? 'Vente...' : 'Vendre le billet'}
          </button>
        </form>
      </div>
    </div>
  );
};
