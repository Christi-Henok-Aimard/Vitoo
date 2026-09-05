import React, { useState } from 'react';
import { companyRegisterApi, companyGoogleLoginApi } from '../../../api/companyAuthApi';
import { GoogleLoginButton } from '../../passenger/components/GoogleLoginButton';
import type { UserSession } from '../../passenger/types/auth';

interface Props {
  onNavigate: (screen: 'login' | 'register' | 'forgot_email' | 'forgot_otp' | 'reset_password') => void;
  onLoginSuccess: (user: UserSession) => void;
}

export default function CompanyRegisterForm({ onNavigate, onLoginSuccess }: Props) {
  const [formData, setFormData] = useState({
    companyName: '',
    rccm: '',
    taxId: '',
    city: '',
    contactName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsLoading(true);
    try {
      const { user, token } = await companyRegisterApi({
        companyName: formData.companyName,
        rccm: formData.rccm,
        taxId: formData.taxId,
        city: formData.city,
        contactName: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
      });
      onLoginSuccess({ ...user, token });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setError('');
    setIsLoading(true);
    try {
      const { user, token } = await companyGoogleLoginApi(idToken);
      onLoginSuccess({ ...user, token });
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : 'Connexion Google impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-glass-form rounded-2xl p-7 text-white auth-fade-in">
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Inscription Compagnie
          <span className="w-6 h-0.5 bg-blue-400 inline-block rounded-full"></span>
        </h2>
        <p className="text-xs text-slate-300 mt-1">Créez votre compte compagnie pour gérer vos trajets.</p>
      </div>

      <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={(err) => setError(err.message)} />

      {error && <p className="mb-4 text-xs font-semibold text-rose-300" role="alert">{error}</p>}

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-white/20"></div>
        <span className="text-xs text-slate-400">ou</span>
        <div className="flex-1 h-px bg-white/20"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          type="text"
          placeholder="Nom de la compagnie"
          className="auth-input w-full p-2.5 rounded-xl text-xs"
          value={formData.companyName}
          onChange={e => setFormData({ ...formData, companyName: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <input
            required
            type="text"
            placeholder="N° RCCM"
            className="auth-input p-2.5 rounded-xl text-xs"
            value={formData.rccm}
            onChange={e => setFormData({ ...formData, rccm: e.target.value })}
          />
          <input
            required
            type="text"
            placeholder="N° Contribuable"
            className="auth-input p-2.5 rounded-xl text-xs"
            value={formData.taxId}
            onChange={e => setFormData({ ...formData, taxId: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <input
            required
            type="text"
            placeholder="Ville de base"
            className="auth-input p-2.5 rounded-xl text-xs"
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
          />
          <input
            required
            type="text"
            placeholder="Nom du responsable"
            className="auth-input p-2.5 rounded-xl text-xs"
            value={formData.contactName}
            onChange={e => setFormData({ ...formData, contactName: e.target.value })}
          />
        </div>

        <input
          required
          type="tel"
          placeholder="Téléphone"
          className="auth-input w-full p-2.5 rounded-xl text-xs"
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
        />

        <input
          required
          type="email"
          placeholder="Email (identifiant de connexion)"
          className="auth-input w-full p-2.5 rounded-xl text-xs"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <input
            required
            type={showPassword ? 'text' : 'password'}
            placeholder="Mot de passe"
            className="auth-input w-full p-2.5 rounded-xl text-xs"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
          <input
            required
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirmer le mot de passe"
            className="auth-input w-full p-2.5 rounded-xl text-xs"
            value={formData.confirmPassword}
            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="togglePasswordCompany"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="togglePasswordCompany" className="text-xs text-slate-300 cursor-pointer select-none">
            Afficher les mots de passe
          </label>
        </div>

        <button type="submit" className="btn-omio w-full py-3 font-bold rounded-xl text-xs mt-2" disabled={isLoading}>
          {isLoading ? 'Inscription en cours...' : 'Créer mon compte compagnie'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-300 mt-4">
        Déjà un compte ? <button onClick={() => onNavigate('login')} className="text-blue-400 font-bold hover:underline">Se connecter</button>
      </p>
    </div>
  );
}
