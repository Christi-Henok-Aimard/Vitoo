import React, { useState } from 'react';
import { companyForgotPasswordApi, companyResetPasswordApi } from '../../../api/companyAuthApi';
import type { UserSession } from '../../passenger/types/auth';

interface Props {
  onNavigate: (screen: 'login' | 'register' | 'forgot_email' | 'forgot_otp' | 'reset_password') => void;
  onLoginSuccess: (user: UserSession) => void;
}

export default function CompanyForgotPasswordForm({ onNavigate }: Props) {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await companyForgotPasswordApi({ email });
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsLoading(true);
    try {
      await companyResetPasswordApi({ email, code, newPassword });
      setSuccess('Mot de passe réinitialisé avec succès !');
      setTimeout(() => onNavigate('login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Réinitialisation impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-glass-form rounded-2xl p-7 text-white auth-fade-in">
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Mot de passe oublié
          <span className="w-6 h-0.5 bg-blue-400 inline-block rounded-full"></span>
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          {step === 'email' && 'Entrez votre email pour recevoir un code de vérification.'}
          {step === 'otp' && `Entrez le code envoyé à ${email}`}
          {step === 'reset' && 'Choisissez votre nouveau mot de passe.'}
        </p>
      </div>

      {error && <p className="mb-4 text-xs font-semibold text-rose-300" role="alert">{error}</p>}
      {success && <p className="mb-4 text-xs font-semibold text-green-300" role="status">{success}</p>}

      {step === 'email' && (
        <form onSubmit={handleSendCode} className="space-y-3">
          <input
            required
            type="email"
            placeholder="Email de la compagnie"
            className="auth-input w-full p-2.5 rounded-xl text-xs"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button type="submit" className="btn-omio w-full py-3 font-bold rounded-xl text-xs" disabled={isLoading}>
            {isLoading ? 'Envoi...' : 'Envoyer le code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={(e) => { e.preventDefault(); setStep('reset'); }} className="space-y-3">
          <input
            required
            type="text"
            placeholder="Code de vérification (6 chiffres)"
            maxLength={6}
            className="auth-input w-full p-2.5 rounded-xl text-xs tracking-widest text-center"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <button type="submit" className="btn-omio w-full py-3 font-bold rounded-xl text-xs" disabled={code.length !== 6}>
            Vérifier le code
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <input
              required
              type={showPassword ? 'text' : 'password'}
              placeholder="Nouveau mot de passe"
              className="auth-input w-full p-2.5 rounded-xl text-xs"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <input
              required
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirmer"
              className="auth-input w-full p-2.5 rounded-xl text-xs"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="togglePasswordCompanyReset"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="togglePasswordCompanyReset" className="text-xs text-slate-300 cursor-pointer select-none">
              Afficher les mots de passe
            </label>
          </div>
          <button type="submit" className="btn-omio w-full py-3 font-bold rounded-xl text-xs" disabled={isLoading}>
            {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-slate-300 mt-4">
        <button onClick={() => onNavigate('login')} className="text-blue-400 font-bold hover:underline">← Retour à la connexion</button>
      </p>
    </div>
  );
}
