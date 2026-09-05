import React, { useState } from 'react';
import { addVehicleApi, deleteVehicleApi, type VehicleData } from '../../../api/companyApi';

interface Props {
  vehicles: VehicleData[];
  onRefresh: () => void;
}

export const VehiclesTab: React.FC<Props> = ({ vehicles, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ plate: '', brand: '', model: '', capacity: '', color: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await addVehicleApi({ ...formData, capacity: Number(formData.capacity) });
      setFormData({ plate: '', brand: '', model: '', capacity: '', color: '' });
      setShowForm(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce véhicule ?')) return;
    try {
      await deleteVehicleApi(id);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur.');
    }
  };

  return (
    <div>
      <div className="page-heading flex items-center justify-between">
        <div>
          <span className="hero-eyebrow">Gestion</span>
          <h1>Véhicules</h1>
          <p>Ajoutez et gérez votre flotte de véhicules.</p>
        </div>
        <button className="primary-action max-w-xs" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Ajouter un véhicule'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Plaque</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Marque</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Modèle</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Capacité (places)</span>
              <input required type="number" className="border border-slate-300 rounded-lg px-3 py-2" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Couleur (optionnel)</span>
              <input className="border border-slate-300 rounded-lg px-3 py-2" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
            </label>
          </div>
          <button type="submit" className="primary-action max-w-xs mt-4" disabled={isLoading}>
            {isLoading ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      )}

      {vehicles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">Aucun véhicule enregistré.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-black text-vitoo-blue">{vehicle.plate}</span>
                <button onClick={() => handleDelete(vehicle.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
              </div>
              <div className="text-sm text-slate-600">{vehicle.brand} {vehicle.model}</div>
              <div className="text-sm text-slate-500">Capacité: {vehicle.capacity} places</div>
              <div className="mt-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${vehicle.status === 'available' ? 'bg-green-100 text-green-700' : vehicle.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {vehicle.status === 'available' ? 'Disponible' : vehicle.status === 'in_transit' ? 'En transit' : 'Maintenance'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
