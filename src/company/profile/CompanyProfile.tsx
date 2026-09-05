import React, { useState } from 'react';
import { Building2, User, Phone, Mail, MapPin, FileText, CreditCard, Plus, Users, Bus, Edit2, Check as CheckMark, X as XClose, Camera, Paperclip, ArrowLeft, CalendarDays, Clock3, ChevronRight } from 'lucide-react';
import type { UserSession } from '../../auth/passenger/types/auth';
import type { DriverData, VehicleData, TripData } from '../../api/companyApi';
import { updateCompanyProfileApi } from '../../api/companyAuthApi';
import { normalizePaymentMethods } from '../dashboard/paymentMethods';
import { COMPANY_SESSION_KEY } from '../../api/sessionKeys';

interface CompanyBranding {
  logo?: string;
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  paymentMethods?: string[];
}

interface CompanyProfileProps {
  currentUser?: UserSession | null;
  initialSection?: ProfileSection;
  onUserUpdate?: (user: UserSession) => void;
  drivers: DriverData[];
  vehicles: VehicleData[];
  trips: TripData[];
  onAddDriver: (driver: Omit<DriverData, 'id' | 'companyId' | 'status'>) => Promise<void>;
  onAddVehicle: (vehicle: Omit<VehicleData, 'id' | 'companyId' | 'status'>) => Promise<void>;
  onUpdateDriver?: (id: string, data: Partial<DriverData>) => Promise<void>;
  onUpdateVehicle?: (id: string, data: Partial<VehicleData>) => Promise<void>;
  onUpdateTrip?: (id: string, data: Partial<TripData>) => Promise<void>;
  onDeleteDriver?: (id: string) => Promise<void>;
  onDeleteVehicle?: (id: string) => Promise<void>;
  onActiveMissionSelect?: (trip: TripData) => void;
  branding: CompanyBranding;
  onBrandingUpdate: (branding: CompanyBranding) => void;
}

type ProfileSection = 'info' | 'branding' | 'drivers' | 'vehicles' | 'payments';

const PAYMENT_METHOD_OPTIONS = ['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Espèces'];

const BRANDING_KEY = 'vitoo_company_branding';

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ currentUser, initialSection = 'info', onUserUpdate, drivers, vehicles, trips, onAddDriver, onAddVehicle, onUpdateDriver, onUpdateVehicle, onUpdateTrip, onDeleteDriver, onDeleteVehicle, onActiveMissionSelect, branding, onBrandingUpdate }) => {
  const [activeSection, setActiveSection] = useState<ProfileSection>(initialSection);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    companyName: currentUser?.companyName || currentUser?.lastName || '',
    contactName: currentUser?.firstName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    city: currentUser?.city || '',
    rccm: currentUser?.rccm || '',
    taxId: currentUser?.taxId || '',
  });

  const [localBranding, setLocalBranding] = useState<CompanyBranding>(() => {
    const methods = normalizePaymentMethods(branding.paymentMethods);
    return {
      ...branding,
      paymentMethods: methods.length ? methods : ['Espèces'],
    };
  });

  const [driverForm, setDriverForm] = useState({ firstName: '', lastName: '', phone: '', licenseNumber: '' });
  const [vehicleForm, setVehicleForm] = useState({ plate: '', brand: '', model: '', capacity: '10', color: '', photo: '' });
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const [editingDriver, setEditingDriver] = useState<DriverData | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<VehicleData | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [selectedMission, setSelectedMission] = useState<TripData | null>(null);

  const updateField = (field: keyof typeof form, value: string) => {
    setSaved(false);
    setError('');
    setForm((prev) => ({ ...prev, [field]: value ?? '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const updated: UserSession = {
        id: currentUser?.id || '',
        firstName: form.contactName,
        lastName: form.companyName,
        phone: form.phone,
        email: form.email,
        city: form.city,
        role: currentUser?.role || 'company',
        token: currentUser?.token,
        provider: currentUser?.provider,
        avatarUrl: currentUser?.avatarUrl,
        companyName: form.companyName,
        rccm: form.rccm,
        taxId: form.taxId,
      };
      const savedUser = await updateCompanyProfileApi({ companyName: form.companyName, city: form.city, phone: form.phone, rccm: form.rccm, taxId: form.taxId });
      const raw = localStorage.getItem(COMPANY_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        localStorage.setItem(COMPANY_SESSION_KEY, JSON.stringify({ ...parsed, ...updated, ...savedUser }));
      }
      onUserUpdate?.({ ...updated, ...savedUser });
      setSaved(true);
      setIsEditing(false);
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandingSave = async () => {
    if (!localBranding.paymentMethods?.length) return;
    localStorage.setItem(BRANDING_KEY, JSON.stringify(localBranding));
    onBrandingUpdate(localBranding);
    const savedUser = await updateCompanyProfileApi({ companyName: localBranding.companyName || form.companyName, companyLogo: localBranding.logo, primaryColor: localBranding.primaryColor, secondaryColor: localBranding.secondaryColor, paymentMethods: localBranding.paymentMethods });
    onUserUpdate?.({ ...currentUser, ...savedUser } as UserSession);
    if (onUpdateTrip) {
      await Promise.all(trips.map((trip) => onUpdateTrip(trip.id, { paymentMethods: localBranding.paymentMethods })));
    }
    setSaved(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLocalBranding((prev) => ({ ...prev, logo: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleVehiclePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (editingVehicle) {
        setEditingVehicle((prev) => (prev ? { ...prev, photo: result } : prev));
      } else {
        setVehicleForm((prev) => ({ ...prev, photo: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingDriver(true);
    try {
      await onAddDriver({
        firstName: driverForm.firstName,
        lastName: driverForm.lastName,
        phone: driverForm.phone,
        licenseNumber: driverForm.licenseNumber,
      });
      setDriverForm({ firstName: '', lastName: '', phone: '', licenseNumber: '' });
      setShowDriverForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Impossible d\'ajouter le chauffeur.');
    } finally {
      setIsAddingDriver(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingVehicle(true);
    try {
      await onAddVehicle({
        plate: vehicleForm.plate,
        brand: vehicleForm.brand,
        model: vehicleForm.model,
        capacity: Number(vehicleForm.capacity),
        color: vehicleForm.color,
        photo: vehicleForm.photo,
      });
      setVehicleForm({ plate: '', brand: '', model: '', capacity: '10', color: '', photo: '' });
      setShowVehicleForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingVehicle(false);
    }
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver || !onUpdateDriver) return;
    try {
      await onUpdateDriver(editingDriver.id, editingDriver);
      setEditingDriver(null);
      setSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateVehicle = async () => {
    if (!editingVehicle || !onUpdateVehicle) return;
    try {
      await onUpdateVehicle(editingVehicle.id, editingVehicle);
      setEditingVehicle(null);
      setSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const sections: { id: ProfileSection; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: 'Informations', icon: <Building2 size={16} /> },
    { id: 'branding', label: 'Marque blanche', icon: <Palette size={16} /> },
    { id: 'drivers', label: `Chauffeurs (${drivers.length})`, icon: <Users size={16} /> },
    { id: 'vehicles', label: `Véhicules (${vehicles.length})`, icon: <Bus size={16} /> },
    { id: 'payments', label: 'Paiements', icon: <CreditCard size={16} /> },
  ];

  return (
    <div className="fade-in">
      <div className="page-heading">
        <span className="hero-eyebrow">Configuration</span>
        <h1>Profil compagnie</h1>
        <p>Configurez votre entreprise avant de commencer à travailler.</p>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {saved && <div className="alert-success"><CheckMark size={16} /> Enregistré avec succès !</div>}

      <div className="profile-section-tabs">
        {sections.map((section) => (
          <button key={section.id} className={`section-tab ${activeSection === section.id ? 'active' : ''}`} onClick={() => setActiveSection(section.id)}>
            {section.icon}
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {activeSection === 'info' && (
        <div className="form-card">
          <div className="form-card-header">
            <h3>Informations générales</h3>
            {!isEditing && (
              <button className="icon-btn" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Modifier
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {isEditing ? (
                <InputField label="Nom de la compagnie" value={form.companyName} onChange={(v) => updateField('companyName', v)} icon={<Building2 size={16} />} required />
              ) : (
                <div className="form-field">
                  <span className="field-label"><Building2 size={16} /> Nom de la compagnie</span>
                  <strong className="field-read-value">{form.companyName || 'Non renseigné'}</strong>
                </div>
              )}
              <InputField label="Responsable" value={form.contactName} onChange={(v) => updateField('contactName', v)} icon={<User size={16} />} disabled={!isEditing} required />
              <InputField label="Téléphone" value={form.phone} onChange={(v) => updateField('phone', v)} icon={<Phone size={16} />} disabled={!isEditing} required />
              <InputField label="Email" type="email" value={form.email} onChange={(v) => updateField('email', v)} icon={<Mail size={16} />} disabled={!isEditing} />
              <InputField label="Ville" value={form.city} onChange={(v) => updateField('city', v)} icon={<MapPin size={16} />} disabled={!isEditing} />
              <InputField label="N° RCCM" value={form.rccm} onChange={(v) => updateField('rccm', v)} icon={<FileText size={16} />} disabled={!isEditing} />
              <InputField label="N° Contribuable" value={form.taxId} onChange={(v) => updateField('taxId', v)} icon={<CreditCard size={16} />} disabled={!isEditing} />
            </div>
            {isEditing && (
              <div className="form-actions">
                <button type="submit" className="primary-action" disabled={isLoading}>
                  {isLoading ? 'Enregistrement...' : <><CheckMark size={16} /> Enregistrer</>}
                </button>
                <button type="button" className="secondary-action" onClick={() => setIsEditing(false)}>
                  <XClose size={16} /> Annuler
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {activeSection === 'branding' && (
        <div className="form-card">
          <div className="form-card-header">
            <h3>Personnalisation de la marque blanche</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">Ces informations seront affichées sur votre portail client. Le logo Vitoo sera remplacé par le vôtre.</p>
          <div className="form-grid">
            <InputField label="Nom de l'entreprise" value={localBranding.companyName || ''} onChange={(v) => setLocalBranding((prev) => ({ ...prev, companyName: v }))} icon={<Building2 size={16} />} />
            <div className="form-field">
              <label className="field-label"><Camera size={16} /> Logo</label>
              <label className="attachment-upload" htmlFor="company-profile-logo-upload" title="Ajouter un fichier">
                <Paperclip size={18} />
                <span>Ajouter</span>
                <input id="company-profile-logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="file-input" />
              </label>
              {localBranding.logo && (
                <div className="logo-preview">
                  <img src={localBranding.logo} alt="Logo preview" />
                  <button type="button" className="icon-btn" onClick={() => setLocalBranding((prev) => ({ ...prev, logo: undefined }))}>
                    <XClose size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="form-field">
              <label className="field-label">Couleur principale</label>
              <input type="color" value={localBranding.primaryColor || '#2563eb'} onChange={(e) => setLocalBranding((prev) => ({ ...prev, primaryColor: e.target.value }))} className="color-input" />
            </div>
            <div className="form-field">
              <label className="field-label">Couleur secondaire</label>
              <input type="color" value={localBranding.secondaryColor || '#f8fafc'} onChange={(e) => setLocalBranding((prev) => ({ ...prev, secondaryColor: e.target.value }))} className="color-input" />
            </div>
          </div>
          <button className="primary-action mt-4" onClick={handleBrandingSave}>
            <CheckMark size={16} /> Enregistrer la marque blanche
          </button>
        </div>
      )}

      {activeSection === 'drivers' && (selectedDriver ? (
        <DriverDetails driver={selectedDriver} trips={trips} selectedMission={selectedMission} onBack={() => selectedMission ? setSelectedMission(null) : setSelectedDriver(null)} onMissionSelect={setSelectedMission} onActiveMissionSelect={onActiveMissionSelect} onEdit={() => { setEditingDriver(selectedDriver); setSelectedDriver(null); }} />
      ) : (
        <div className="form-card">
          <div className="form-card-header">
            <h3>Base de données chauffeurs</h3>
            <button className="icon-btn" onClick={() => setShowDriverForm(!showDriverForm)}>
              {showDriverForm ? <XClose size={16} /> : <><Plus size={16} /> Ajouter</>}
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">Seuls les chauffeurs déjà inscrits comme passagers Vitoo (même numéro) peuvent être ajoutés : ils gèrent eux-mêmes leur mot de passe. Dès l'ajout, leur espace chauffeur est activé et ils en sont notifiés par SMS et dans l'application. Cliquez sur un chauffeur pour modifier ses informations.</p>

          {showDriverForm && (
            <form onSubmit={handleAddDriver} className="sub-form">
              <div className="form-grid">
                <InputField label="Prénom" value={driverForm.firstName} onChange={(v) => setDriverForm({ ...driverForm, firstName: v })} icon={<User size={16} />} required />
                <InputField label="Nom" value={driverForm.lastName} onChange={(v) => setDriverForm({ ...driverForm, lastName: v })} icon={<User size={16} />} required />
                <InputField label="Téléphone (compte passager existant)" value={driverForm.phone} onChange={(v) => setDriverForm({ ...driverForm, phone: v })} icon={<Phone size={16} />} required />
                <InputField label="N° Permis" value={driverForm.licenseNumber} onChange={(v) => setDriverForm({ ...driverForm, licenseNumber: v })} icon={<FileText size={16} />} required />
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-action" disabled={isAddingDriver}>
                  {isAddingDriver ? 'Ajout...' : <><CheckMark size={16} /> Ajouter le chauffeur</>}
                </button>
                <button type="button" className="secondary-action" onClick={() => setShowDriverForm(false)}>
                  <XClose size={16} /> Annuler
                </button>
              </div>
            </form>
          )}

          {/* Edit driver modal */}
          {editingDriver && (
            <div className="sub-form editing-form">
              <h4><Edit2 size={16} /> Modifier le chauffeur</h4>
              <div className="form-grid">
                <InputField label="Prénom" value={editingDriver.firstName} onChange={(v) => setEditingDriver({ ...editingDriver, firstName: v })} icon={<User size={16} />} />
                <InputField label="Nom" value={editingDriver.lastName} onChange={(v) => setEditingDriver({ ...editingDriver, lastName: v })} icon={<User size={16} />} />
                <InputField label="Téléphone" value={editingDriver.phone} onChange={(v) => setEditingDriver({ ...editingDriver, phone: v })} icon={<Phone size={16} />} />
                <InputField label="N° Permis" value={editingDriver.licenseNumber || ''} onChange={(v) => setEditingDriver({ ...editingDriver, licenseNumber: v })} icon={<FileText size={16} />} />
                <div className="form-field">
                  <label className="field-label">Statut</label>
                  <select className="field-input" value={editingDriver.status} onChange={(e) => setEditingDriver({ ...editingDriver, status: e.target.value as DriverData['status'] })}>
                    <option value="available">Disponible</option>
                    <option value="on_trip">En course</option>
                    <option value="off_duty">Indisponible</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-action" onClick={handleUpdateDriver}><CheckMark size={16} /> Enregistrer</button>
                <button className="secondary-action" onClick={() => setEditingDriver(null)}><XClose size={16} /> Annuler</button>
              </div>
            </div>
          )}

          {drivers.length === 0 ? (
            <div className="empty-state"><Users size={48} /><p>Aucun chauffeur enregistré.</p></div>
          ) : (
            <div className="mini-list">
              {drivers.map((driver) => (
                <div key={driver.id} className="mini-list-item clickable" onClick={() => setSelectedDriver(driver)}>
                  <div className="mini-list-avatar"><User size={18} /></div>
                  <div className="mini-list-content">
                    <strong>{driver.firstName} {driver.lastName}</strong>
                    <span className="text-sm text-slate-500">{driver.phone} · Permis {driver.licenseNumber}</span>
                  </div>
                  <span className={`pill pill-${driver.status === 'available' ? 'green' : driver.status === 'on_trip' ? 'orange' : 'grey'}`}>
                    {driver.status === 'available' ? 'Disponible' : driver.status === 'on_trip' ? 'En course' : 'Indisponible'}
                  </span>
                  <div className="mini-list-actions">
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setSelectedDriver(driver); }}><Edit2 size={14} /></button>
                    <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); onDeleteDriver?.(driver.id); }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {activeSection === 'vehicles' && (selectedVehicle ? (
        <VehicleDetails vehicle={selectedVehicle} trips={trips} selectedMission={selectedMission} onBack={() => selectedMission ? setSelectedMission(null) : setSelectedVehicle(null)} onMissionSelect={setSelectedMission} onActiveMissionSelect={onActiveMissionSelect} onEdit={() => { setEditingVehicle(selectedVehicle); setSelectedVehicle(null); }} />
      ) : (
        <div className="form-card">
          <div className="form-card-header">
            <h3>Base de données véhicules</h3>
            <button className="icon-btn" onClick={() => setShowVehicleForm(!showVehicleForm)}>
              {showVehicleForm ? <XClose size={16} /> : <><Plus size={16} /> Ajouter</>}
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">Les véhicules ajoutés ici serviront à alimenter votre base de données. Cliquez sur un véhicule pour modifier. Vous pouvez aussi ajouter une photo pour la vitrine.</p>

          {showVehicleForm && (
            <form onSubmit={handleAddVehicle} className="sub-form">
              <div className="form-grid">
                <InputField label="Plaque" value={vehicleForm.plate} onChange={(v) => setVehicleForm({ ...vehicleForm, plate: v })} icon={<FileText size={16} />} required />
                <InputField label="Marque" value={vehicleForm.brand} onChange={(v) => setVehicleForm({ ...vehicleForm, brand: v })} icon={<Bus size={16} />} required />
                <InputField label="Modèle" value={vehicleForm.model} onChange={(v) => setVehicleForm({ ...vehicleForm, model: v })} icon={<Bus size={16} />} required />
                <InputField label="Capacité (min. 10)" type="number" value={vehicleForm.capacity} onChange={(v) => setVehicleForm({ ...vehicleForm, capacity: v })} icon={<Users size={16} />} required min="10" />
                <InputField label="Couleur" value={vehicleForm.color} onChange={(v) => setVehicleForm({ ...vehicleForm, color: v })} icon={<Palette size={16} />} />
                <div className="form-field">
                  <label className="field-label"><Camera size={16} /> Photo du véhicule</label>
                  <label className="attachment-upload" htmlFor="vehicle-photo-upload" title="Ajouter un fichier">
                    <Paperclip size={18} />
                    <span>Ajouter</span>
                    <input id="vehicle-photo-upload" type="file" accept="image/*" onChange={handleVehiclePhotoUpload} className="file-input" />
                  </label>
                  {vehicleForm.photo && <div className="logo-preview"><img src={vehicleForm.photo} alt="Vehicle" /></div>}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-action" disabled={isAddingVehicle}>
                  {isAddingVehicle ? 'Ajout...' : <><CheckMark size={16} /> Ajouter le véhicule</>}
                </button>
                <button type="button" className="secondary-action" onClick={() => setShowVehicleForm(false)}>
                  <XClose size={16} /> Annuler
                </button>
              </div>
            </form>
          )}

          {/* Edit vehicle modal */}
          {editingVehicle && (
            <div className="sub-form editing-form">
              <h4><Edit2 size={16} /> Modifier le véhicule</h4>
              <div className="form-grid">
                <InputField label="Plaque" value={editingVehicle.plate} onChange={(v) => setEditingVehicle({ ...editingVehicle, plate: v })} icon={<FileText size={16} />} />
                <InputField label="Marque" value={editingVehicle.brand} onChange={(v) => setEditingVehicle({ ...editingVehicle, brand: v })} icon={<Bus size={16} />} />
                <InputField label="Modèle" value={editingVehicle.model} onChange={(v) => setEditingVehicle({ ...editingVehicle, model: v })} icon={<Bus size={16} />} />
                <InputField label="Capacité" type="number" value={String(editingVehicle.capacity)} onChange={(v) => setEditingVehicle({ ...editingVehicle, capacity: Number(v) })} icon={<Users size={16} />} />
                <InputField label="Couleur" value={editingVehicle.color || ''} onChange={(v) => setEditingVehicle({ ...editingVehicle, color: v })} icon={<Palette size={16} />} />
                <div className="form-field">
                  <label className="field-label">Statut</label>
                  <select className="field-input" value={editingVehicle.status} onChange={(e) => setEditingVehicle({ ...editingVehicle, status: e.target.value as VehicleData['status'] })}>
                    <option value="available">Disponible</option>
                    <option value="in_transit">En course</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="field-label"><Camera size={16} /> Photo</label>
                  <label className="attachment-upload" htmlFor="editing-vehicle-photo-upload" title="Ajouter un fichier">
                    <Paperclip size={18} />
                    <span>Ajouter</span>
                    <input id="editing-vehicle-photo-upload" type="file" accept="image/*" onChange={handleVehiclePhotoUpload} className="file-input" />
                  </label>
                  {editingVehicle.photo && <div className="logo-preview"><img src={editingVehicle.photo} alt="Vehicle" /></div>}
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-action" onClick={handleUpdateVehicle}><CheckMark size={16} /> Enregistrer</button>
                <button className="secondary-action" onClick={() => setEditingVehicle(null)}><XClose size={16} /> Annuler</button>
              </div>
            </div>
          )}

          {vehicles.length === 0 ? (
            <div className="empty-state"><Bus size={48} /><p>Aucun véhicule enregistré.</p></div>
          ) : (
             <div className="mini-list">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="mini-list-item clickable" onClick={() => setSelectedVehicle(vehicle)}>
                  <div className="mini-list-avatar">
                    {vehicle.photo ? (
                      <img src={vehicle.photo} alt={vehicle.plate} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <Bus size={18} />
                    )}
                  </div>
                  <div className="mini-list-content">
                    <strong>{vehicle.plate}</strong>
                    <span className="text-sm text-slate-500">{vehicle.brand} {vehicle.model} · {vehicle.capacity} places · {vehicle.color}</span>
                  </div>
                  <span className={`pill pill-${vehicle.status === 'available' ? 'green' : vehicle.status === 'in_transit' ? 'orange' : 'grey'}`}>
                    {vehicle.status === 'available' ? 'Disponible' : vehicle.status === 'in_transit' ? 'En course' : 'Maintenance'}
                  </span>
                  <div className="mini-list-actions">
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setSelectedVehicle(vehicle); }}><Edit2 size={14} /></button>
                    <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); onDeleteVehicle?.(vehicle.id); }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {activeSection === 'payments' && (
        <div className="form-card">
          <div className="form-card-header">
            <h3>Moyens de paiement</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">Choisissez les moyens que vos passagers verront en ligne pour payer leurs billets.</p>
          <div className="payment-method-grid">
            {PAYMENT_METHOD_OPTIONS.map((method) => {
              const selected = (localBranding.paymentMethods || ['Espèces']).includes(method);
              return (
                <label className={`payment-method-option ${selected ? 'selected' : ''}`} key={method}>
                  <input type="checkbox" checked={selected} onChange={() => setLocalBranding((previous) => {
                    const current = previous.paymentMethods || ['Espèces'];
                    const paymentMethods = selected ? current.filter((item) => item !== method) : [...current, method];
                    return { ...previous, paymentMethods };
                  })} />
                  <CreditCard size={18} />
                  <span><strong>{method}</strong><small>{selected ? 'Visible en ligne' : 'Masqué des passagers'}</small></span>
                </label>
              );
            })}
          </div>
          <button className="primary-action mt-4" onClick={handleBrandingSave} disabled={!localBranding.paymentMethods?.length}>
            <CheckMark size={16} /> Enregistrer les moyens de paiement
          </button>
        </div>
      )}
    </div>
  );
};

const missionStatusLabel = (status: TripData['status']) => {
  if (status === 'in_transit') return 'En cours';
  if (status === 'boarding') return 'Embarquement';
  return 'En attente';
};

const MissionDetails: React.FC<{ mission: TripData; onBack: () => void }> = ({ mission, onBack }) => (
  <div className="form-card detail-card">
    <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour</button>
    <div className="detail-heading">
      <div>
        <span className="hero-eyebrow">Mission</span>
        <h2>{mission.depart} → {mission.arrivee}</h2>
        <p>{missionStatusLabel(mission.status)}</p>
      </div>
      <span className={`pill pill-${mission.status === 'in_transit' ? 'green' : 'orange'}`}>{missionStatusLabel(mission.status)}</span>
    </div>
    <div className="detail-grid">
      <div><CalendarDays size={16} /><span>Date<strong>{mission.date}</strong></span></div>
      <div><Clock3 size={16} /><span>Heure<strong>{mission.time}</strong></span></div>
      <div><Bus size={16} /><span>Station<strong>{mission.station}</strong></span></div>
      <div><Users size={16} /><span>Places<strong>{mission.availableSeats}/{mission.totalSeats}</strong></span></div>
    </div>
    {mission.stops.length > 0 && <p className="detail-stops"><b>Escales :</b> {mission.stops.join(', ')}</p>}
  </div>
);

const MissionList: React.FC<{ trips: TripData[]; onSelect: (trip: TripData) => void; onActiveMissionSelect?: (trip: TripData) => void }> = ({ trips, onSelect, onActiveMissionSelect }) => (
  <div className="mission-list">
    {trips.length === 0 ? <p className="empty-detail">Aucune mission en cours ou en attente.</p> : trips.map((trip) => (
      <button type="button" key={trip.id} className="mission-item" onClick={() => trip.status === 'in_transit' && onActiveMissionSelect ? onActiveMissionSelect(trip) : onSelect(trip)}>
        <span><strong>{trip.depart} → {trip.arrivee}</strong><small>{trip.date} à {trip.time}</small></span>
        <span className={`pill pill-${trip.status === 'in_transit' ? 'green' : 'orange'}`}>{missionStatusLabel(trip.status)}</span>
        <ChevronRight size={16} />
      </button>
    ))}
  </div>
);

const DriverDetails: React.FC<{ driver: DriverData; trips: TripData[]; selectedMission: TripData | null; onBack: () => void; onMissionSelect: (trip: TripData) => void; onActiveMissionSelect?: (trip: TripData) => void; onEdit: () => void }> = ({ driver, trips, selectedMission, onBack, onMissionSelect, onActiveMissionSelect, onEdit }) => {
  const assignedTrips = trips.filter((trip) => trip.driverId === driver.id && ['scheduled', 'boarding', 'in_transit'].includes(trip.status));
  if (selectedMission) return <MissionDetails mission={selectedMission} onBack={onBack} />;
  return (
    <div className="form-card detail-card">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour aux chauffeurs</button>
      <div className="detail-heading"><div><span className="hero-eyebrow">Chauffeur</span><h2>{driver.firstName} {driver.lastName}</h2><p>{driver.phone} · Permis {driver.licenseNumber || 'Non renseigné'}</p></div><button type="button" className="icon-btn" onClick={onEdit}><Edit2 size={16} /> Modifier</button></div>
      <h3 className="detail-section-title">Missions en cours ou en attente</h3>
      <MissionList trips={assignedTrips} onSelect={onMissionSelect} onActiveMissionSelect={onActiveMissionSelect} />
    </div>
  );
};

const VehicleDetails: React.FC<{ vehicle: VehicleData; trips: TripData[]; selectedMission: TripData | null; onBack: () => void; onMissionSelect: (trip: TripData) => void; onActiveMissionSelect?: (trip: TripData) => void; onEdit: () => void }> = ({ vehicle, trips, selectedMission, onBack, onMissionSelect, onActiveMissionSelect, onEdit }) => {
  const assignedTrips = trips.filter((trip) => trip.vehicleId === vehicle.id && ['scheduled', 'boarding', 'in_transit'].includes(trip.status));
  if (selectedMission) return <MissionDetails mission={selectedMission} onBack={onBack} />;
  return (
    <div className="form-card detail-card">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour aux véhicules</button>
      <div className="detail-heading"><div><span className="hero-eyebrow">Véhicule</span><h2>{vehicle.plate}</h2><p>{vehicle.brand} {vehicle.model} · {vehicle.capacity} places · {vehicle.color || 'Couleur non renseignée'}</p></div><button type="button" className="icon-btn" onClick={onEdit}><Edit2 size={16} /> Modifier</button></div>
      <h3 className="detail-section-title">Missions en cours ou en attente</h3>
      <MissionList trips={assignedTrips} onSelect={onMissionSelect} onActiveMissionSelect={onActiveMissionSelect} />
    </div>
  );
};

const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode; type?: string; disabled?: boolean; required?: boolean; placeholder?: string; min?: string }> = ({ label, value, onChange, icon, type = 'text', disabled, required, placeholder, min }) => (
  <div className="form-field">
    <label className="field-label">{icon} {label}</label>
    <input className="field-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} required={required} placeholder={placeholder} min={min} />
  </div>
);

const Palette: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);
