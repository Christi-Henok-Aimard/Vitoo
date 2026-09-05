import React, { useState } from 'react';
import { companyLoginApi } from '../../../api/companyAuthApi';
import type { UserSession } from '../../passenger/types/auth';

interface Props {
  onNavigate: (screen: 'login' | 'register' | 'forgot_email' | 'forgot_otp' | 'reset_password') => void;
  onLoginSuccess: (user: UserSession) => void;
}

export default function CompanyLoginForm({ onNavigate, onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { user, token } = await companyLoginApi(email, password);
      onLoginSuccess({ ...user, token });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-glass-form rounded-2xl p-7 text-white auth-fade-in">
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Connexion Compagnie
          <span className="w-6 h-0.5 bg-blue-400 inline-block rounded-full"></span>
        </h2>
        <p className="text-xs text-slate-300 mt-1">Accédez à votre espace de gestion.</p>
      </div>

      {error && <p className="mb-4 text-xs font-semibold text-rose-300" role="alert">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          type="email"
          placeholder="Email"
          className="auth-input w-full p-2.5 rounded-xl text-xs"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <div className="relative">
          <input
            required
            type={showPassword ? 'text' : 'password'}
            placeholder="Mot de passe"
            className="auth-input w-full p-2.5 pr-8 rounded-xl text-xs"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="togglePasswordCompanyLogin"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="togglePasswordCompanyLogin" className="text-xs text-slate-300 cursor-pointer select-none">
              Afficher
            </label>
          </div>
          <button type="button" onClick={() => onNavigate('forgot_email')} className="text-xs text-blue-400 font-bold hover:underline">
            Mot de passe oublié ?
          </button>
        </div>

        <button type="submit" className="btn-omio w-full py-3 font-bold rounded-xl text-xs mt-2" disabled={isLoading}>
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-300 mt-4">
        Pas encore de compte ? <button onClick={() => onNavigate('register')} className="text-blue-400 font-bold hover:underline">S'inscrire</button>
      </p>
    </div>
  );
}
