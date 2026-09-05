import React, { useState } from 'react';
import { Camera, Edit3, LockKeyhole, MapPin, Phone, Save, User, X } from 'lucide-react';
import type { UserSession } from '../../auth/passenger/types/auth';
import { updateMeApi, updatePasswordApi } from '../../api/authApi';

interface UserProfileProps {
  currentUser?: UserSession;
  photo?: string | null;
  onPhotoChange?: (photo: string) => void;
  onUserUpdate?: (user: UserSession) => void;
}

const STORAGE_KEY = 'vitoo_session';

const syncSession = (updated: UserSession) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = { ...parsed, ...updated, token: parsed.token || updated.token };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
  } catch {
    /* ignore */
  }
};

export const UserProfile: React.FC<UserProfileProps> = ({ currentUser, photo, onPhotoChange, onUserUpdate }) => {
  const [form, setForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    city: currentUser?.city || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    password: '',
    currentPassword: '',
  });
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setSaved(false);
    setError('');
    setForm((previous) => ({ ...previous, [field]: value ?? '' }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaved(false);
    const trimmedFirst = form.firstName.trim();
    const trimmedLast = form.lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      setError('Le prénom et le nom sont obligatoires.');
      return;
    }

    setIsLoading(true);
    try {
      const payload: Record<string, string> = {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        city: form.city.trim(),
        phone: form.phone.trim(),
      };
      if (form.email?.trim()) payload.email = form.email.trim();

      const { user } = await updateMeApi(payload);
      syncSession(user);
      onUserUpdate?.(user);

      if (form.password) {
        if (!form.currentPassword) {
          setError('Saisissez votre mot de passe actuel pour changer le mot de passe.');
          setIsLoading(false);
          return;
        }
        await updatePasswordApi(form.currentPassword, form.password);
        setForm((prev) => ({ ...prev, password: '', currentPassword: '' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de mettre à jour le profil.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="profile-page">
      <div className="page-heading">
        <span className="hero-eyebrow">Votre espace</span>
        <h1>Mon profil</h1>
        <p>Gardez vos informations à jour pour voyager sans friction.</p>
      </div>

      <div className="profile-layout">
        <form className={`profile-card ${isEditing ? 'is-editing' : ''}`} onSubmit={handleSubmit}>
          <div className="profile-header">
            <label className="profile-avatar" htmlFor="profile-photo">
              {photo ? <img src={photo} alt="Profil" /> : <User />}
              <span><Camera /></span>
            </label>
            <input
              id="profile-photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onPhotoChange?.(URL.createObjectURL(file));
              }}
            />
            <div className="profile-header-info">
              <h3>
                {form.firstName.trim() || 'Prénom'} {form.lastName.trim() || 'Nom'}
              </h3>
              <p>Passager Vitoo</p>
            </div>
            <button
              type="button"
              className="icon-action"
              onClick={() => {
                setIsEditing((value) => !value);
                setError('');
                setSaved(false);
              }}
              aria-label={isEditing ? 'Annuler la modification' : 'Modifier le profil'}
              disabled={isLoading}
            >
              {isEditing ? <X /> : <Edit3 />}
            </button>
          </div>

          <div className="profile-grid">
            <label>
              Prénom
              <strong className={isEditing ? 'profile-read-value hidden' : 'profile-read-value'}>
                {form.firstName.trim() || 'Non renseigné'}
              </strong>
              <input
                className={isEditing ? '' : 'profile-edit-field hidden'}
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                disabled={isLoading}
              />
            </label>

            <label>
              Nom
              <strong className={isEditing ? 'profile-read-value hidden' : 'profile-read-value'}>
                {form.lastName.trim() || 'Non renseigné'}
              </strong>
              <input
                className={isEditing ? '' : 'profile-edit-field hidden'}
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                disabled={isLoading}
              />
            </label>

            <label>
              <MapPin /> Ville
              <strong className={isEditing ? 'profile-read-value hidden' : 'profile-read-value'}>
                {form.city.trim() || 'Non renseignée'}
              </strong>
              <input
                className={isEditing ? '' : 'profile-edit-field hidden'}
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                disabled={isLoading}
              />
            </label>

            <label>
              <Phone /> Numéro de téléphone
              <strong className={isEditing ? 'profile-read-value hidden' : 'profile-read-value'}>
                {form.phone.trim() || 'Non renseigné'}
              </strong>
              <input
                className={isEditing ? '' : 'profile-edit-field hidden'}
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                disabled={isLoading}
              />
            </label>

            <label className={isEditing ? '' : 'hidden'}>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="Optionnel"
                disabled={isLoading}
              />
            </label>

            <label className={`profile-wide profile-password-field ${isEditing ? '' : 'hidden'}`}>
              <LockKeyhole /> Mot de passe actuel
              <input
                type="password"
                placeholder="Requis pour changer de mot de passe"
                value={form.currentPassword}
                onChange={(event) => updateField('currentPassword', event.target.value)}
                disabled={isLoading}
              />
            </label>

            <label className={`profile-wide profile-password-field ${isEditing ? '' : 'hidden'}`}>
              <LockKeyhole /> Nouveau mot de passe
              <input
                type="password"
                placeholder="Laisser vide pour conserver l'ancien"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                disabled={isLoading}
              />
            </label>
          </div>

          <p className={`profile-error ${error ? '' : 'hidden'}`} role="alert">
            {error || ' '}
          </p>

          <button
            type="submit"
            className={`primary-action profile-save-button ${isEditing ? '' : 'hidden'}`}
            disabled={isLoading}
          >
            <Save /> {isLoading ? 'Enregistrement...' : saved ? 'Profil enregistré' : 'Enregistrer les modifications'}
          </button>
        </form>

        <aside className="profile-sidebar">
          {currentUser?.driverSpace && (
            <div className="profile-card profile-driver-space">
              <h4>🚌 Mon espace chauffeur</h4>
              <p>
                Vous travaillez pour <strong>{currentUser.driverSpace.companyName}</strong>.
                Accédez à vos missions, au scan des billets et au suivi GPS.
              </p>
              <button
                type="button"
                className="primary-action"
                onClick={() => { window.location.href = '/driver'; }}
              >
                Basculer dans mon espace chauffeur
              </button>
            </div>
          )}

          <div className="profile-card profile-security">
            <h4>Sécurité</h4>
            <p>Votre compte est protégé. Modifiez votre mot de passe régulièrement.</p>
            <button type="button" className="secondary-action" onClick={() => { setIsEditing(true); }}>
              <LockKeyhole /> Modifier le mot de passe
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
};
