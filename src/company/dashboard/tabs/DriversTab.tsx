import React, { useState } from 'react';
import { addDriverApi, deleteDriverApi, type DriverData } from '../../../api/companyApi';

interface Props {
  drivers: DriverData[];
  onRefresh: () => void;
}

export const DriversTab: React.FC<Props> = ({ drivers, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', licenseNumber: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await addDriverApi(formData);
      setFeedback(`${formData.firstName} ${formData.lastName} a été ajouté. Un SMS d'invitation lui a été envoyé.`);
      setFormData({ firstName: '', lastName: '', phone: '', licenseNumber: '', password: '' });
      setShowForm(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce chauffeur ?')) return;
    try {
      await deleteDriverApi(id);
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
          <h1>Chauffeurs</h1>
          <p>Ajoutez et gérez les chauffeurs de votre compagnie.</p>
        </div>
        <button className="primary-action max-w-xs" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Ajouter un chauffeur'}
        </button>
      </div>

      {feedback && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-4 text-sm font-semibold">{feedback}</div>}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Prénom</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Nom</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Téléphone</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">N° Permis (optionnel)</span>
              <input className="border border-slate-300 rounded-lg px-3 py-2" value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })} />
            </label>
          <label className="grid gap-1">
              <span className="text-sm font-bold text-slate-600">Mot de passe (connexion du chauffeur)</span>
              <input required className="border border-slate-300 rounded-lg px-3 py-2" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-3 mb-2">
            Le chauffeur reçoit un SMS d'invitation. Il se connecte avec ce numéro et le mot de passe ci-dessus, puis accède à son espace chauffeur depuis son profil passager.
          </p>
          <button type="submit" className="primary-action max-w-xs" disabled={isLoading}>
            {isLoading ? 'Ajout...' : 'Ajouter et envoyer le SMS'}
          </button>
        </form>
      )}

      {drivers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">Aucun chauffeur enregistré.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-bold text-slate-600">Nom</th>
                <th className="text-left p-3 font-bold text-slate-600">Téléphone</th>
                <th className="text-left p-3 font-bold text-slate-600">Statut</th>
                <th className="text-right p-3 font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id} className="border-b border-slate-100">
                  <td className="p-3 font-bold">{driver.firstName} {driver.lastName}</td>
                  <td className="p-3">{driver.phone}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${driver.status === 'available' ? 'bg-green-100 text-green-700' : driver.status === 'on_trip' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {driver.status === 'available' ? 'Disponible' : driver.status === 'on_trip' ? 'En course' : 'Repos'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleDelete(driver.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
