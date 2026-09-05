import React, { useEffect, useState } from 'react';
import { Building2, Car, CircleOff, Save, ShoppingBag, Star, TrendingUp, Users } from 'lucide-react';
import { updateMeApi, updatePasswordApi } from '../../api/authApi';
import { getDriverStatsApi, updateDriverStatusApi, type DriverStats } from '../../api/driverApi';
import type { UserSession } from '../../auth/passenger/types/auth';

export const DriverProfile: React.FC<{ currentUser: UserSession; onCurrentUserChange: (u: UserSession) => void; onLogout: () => void }> = ({ currentUser, onCurrentUserChange, onLogout }) => {
  const [form, setForm] = useState({
    firstName: currentUser.firstName || '',
    lastName: currentUser.lastName || '',
    city: currentUser.city || '',
    phone: currentUser.phone || '',
    email: currentUser.email || '',
  });
  const [password, setPassword] = useState({ current: '', next: '' });
  const [status, setStatus] = useState<string>(currentUser.driverSpace?.status || 'available');
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getDriverStatsApi()
      .then((res) => setStats(res.stats))
      .catch(() => undefined);
  }, []);

  const saveProfile = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const payload: Record<string, string> = {};
      if (form.firstName !== (currentUser.firstName || '')) payload.firstName = form.firstName;
      if (form.lastName !== (currentUser.lastName || '')) payload.lastName = form.lastName;
      if (form.city !== (currentUser.city || '')) payload.city = form.city;
      if (form.phone !== (currentUser.phone || '')) payload.phone = form.phone;
      if (form.email !== (currentUser.email || '')) payload.email = form.email;
      let profileUpdated = false;
      if (Object.keys(payload).length > 0) {
        const res = await updateMeApi(payload);
        onCurrentUserChange(res.user);
        profileUpdated = true;
      }
      if (password.next) {
        if (!password.current) {
          setError('Saisissez votre mot de passe actuel pour changer le mot de passe.');
          return;
        }
        await updatePasswordApi(password.current, password.next);
        setPassword({ current: '', next: '' });
        setSuccess(profileUpdated ? 'Profil et mot de passe mis à jour.' : 'Mot de passe mis à jour.');
      } else {
        setSuccess('Profil mis à jour.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (next: string) => {
    setStatus(next);
    try {
      await updateDriverStatusApi(next as 'available' | 'on_trip' | 'off_duty');
      onCurrentUserChange({ ...currentUser, driverSpace: { ...(currentUser.driverSpace || { id: '', companyId: '', companyName: '', status: 'available' as const }), status: next as 'available' | 'on_trip' | 'off_duty' } });
      setSuccess(next === 'available' ? 'Vous êtes maintenant disponible.' : 'Vous êtes marqué comme indisponible.');
    } catch (err) {
      setStatus(currentUser.driverSpace?.status || 'available');
      setError(err instanceof Error ? err.message : 'Impossible de changer de statut.');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-heading">
        <span className="hero-eyebrow">Espace chauffeur</span>
        <h1>Mon profil</h1>
      </div>

      <div className="driver-profile-header">
        <div className="driver-avatar-large"><Car size={32} /></div>
        <div className="profile-header-info">
          <h3>{currentUser.firstName} {currentUser.lastName}</h3>
          <p>{currentUser.phone} · {currentUser.city}</p>
          <span className={`pill ${status === 'available' ? 'pill-green' : status === 'on_trip' ? 'pill-orange' : 'pill-grey'}`}>
            {status === 'available' ? 'Disponible' : status === 'on_trip' ? 'En trajet' : 'Indisponible'}
          </span>
        </div>
      </div>

      {currentUser.driverSpace?.companyName && (
        <div className="driver-info-card">
          <Building2 size={20} />
          <div>
            <strong style={{ display: 'block' }}>Chauffeur de {currentUser.driverSpace.companyName}</strong>
            <small style={{ color: 'var(--vitoo-text-soft, #77869c)' }}>{currentUser.driverSpace.licenseNumber ? `Permis ${currentUser.driverSpace.licenseNumber}` : 'Permis non renseigné'}</small>
          </div>
        </div>
      )}

      {stats && (
        <>
          <h3 className="section-title">Mes statistiques</h3>
          <div className="stats-grid">
            <div className="stat-card stat-blue"><TrendingUp size={20} /><span className="stat-value">{stats.tripsCompleted}</span><span className="stat-label">Trajets complétés</span></div>
            <div className="stat-card stat-green"><Users size={20} /><span className="stat-value">{stats.passengersTransported}</span><span className="stat-label">Passagers transportés</span></div>
            <div className="stat-card stat-orange"><Car size={20} /><span className="stat-value">{stats.kilometersDriven} km</span><span className="stat-label">Kilomètres</span></div>
            <div className="stat-card stat-purple"><Star size={20} /><span className="stat-value">{stats.averageRating || '—'}</span><span className="stat-label">Note moyenne</span></div>
          </div>
        </>
      )}

      <h3 className="section-title">Disponibilité</h3>
      <div className="setting-row">
        <span><CircleOff size={18} /> <span className="setting-label"><b>Statut de conduite</b><small>Les missions vous sont confiées quand vous êtes disponible</small></span></span>
        <select className="setting-select" value={status} onChange={(e) => void changeStatus(e.target.value)}>
          <option value="available">Disponible</option>
          <option value="on_trip">En trajet</option>
          <option value="off_duty">Indisponible</option>
        </select>
      </div>

      <div className="profile-card" style={{ marginTop: '1.25rem' }}>
        <div className="profile-header">
          <div className="profile-header-info"><h3>Mes informations</h3><p>Ces informations sont celles de votre compte Vitoo (espace passager et chauffeur).</p></div>
        </div>
        {error && <p className="profile-error">{error}</p>}
        <div className="profile-grid">
          <label>Prénom<input value={form.firstName} onChange={(e) => { setError(''); setSuccess(''); setForm({ ...form, firstName: e.target.value }); }} /></label>
          <label>Nom<input value={form.lastName} onChange={(e) => { setError(''); setSuccess(''); setForm({ ...form, lastName: e.target.value }); }} /></label>
          <label>Ville<input value={form.city} onChange={(e) => { setError(''); setSuccess(''); setForm({ ...form, city: e.target.value }); }} /></label>
          <label>Téléphone<input value={form.phone} disabled /></label>
          <label className="profile-wide">Email<input type="email" value={form.email} onChange={(e) => { setError(''); setSuccess(''); setForm({ ...form, email: e.target.value }); }} /></label>
        </div>
        <button type="button" className="action-btn primary profile-save-button" onClick={() => void saveProfile()} disabled={busy}>
          {busy ? 'Enregistrement…' : <><Save size={16} /> Enregistrer</>}
        </button>
        {success && <p style={{ marginTop: '0.75rem', color: '#0d8a6a', fontWeight: 800, fontSize: '0.85rem' }}>{success}</p>}
      </div>

      <div className="profile-card" style={{ marginTop: '1.25rem' }}>
        <div className="profile-header">
          <div className="profile-header-info"><h3>Changer mon mot de passe</h3><p>Le mot de passe de votre compte Vitoo.</p></div>
        </div>
        <div className="profile-grid">
          <label>Mot de passe actuel<input type="password" value={password.current} onChange={(e) => { setError(''); setSuccess(''); setPassword({ ...password, current: e.target.value }); }} /></label>
          <label>Nouveau mot de passe<input type="password" value={password.next} onChange={(e) => { setError(''); setSuccess(''); setPassword({ ...password, next: e.target.value }); }} /></label>
        </div>
        <button type="button" className="action-btn profile-save-button" onClick={() => void saveProfile()} disabled={busy}>
          {busy ? 'Enregistrement…' : <><Save size={16} /> Mettre à jour le mot de passe</>}
        </button>
      </div>

      <div className="action-buttons">
        <button type="button" className="action-btn" onClick={() => { window.location.href = '/passenger'; }}><ShoppingBag size={16} /> Retour à mon espace passager</button>
        <button type="button" className="logout-btn-full" onClick={onLogout}>Se déconnecter</button>
      </div>
    </div>
  );
};