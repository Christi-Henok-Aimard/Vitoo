import React, { useState, useEffect, useRef } from 'react';
import { AUTH_TEXTS } from '../constants/authText';
import type { AuthScreen } from '../types/auth';
import { forgotPasswordApi, resetPasswordApi } from '../../../api/authApi';

interface Props {
  screen: 'forgot_phone' | 'forgot_otp' | 'reset_password';
  onNavigate: (screen: AuthScreen) => void;
}

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordForm({ screen, onNavigate }: Props) {
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef<number | null>(null);
  const t = AUTH_TEXTS.forgotPassword;

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) {
        window.clearInterval(resendTimerRef.current);
      }
    };
  }, []);

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
    if (resendTimerRef.current) window.clearInterval(resendTimerRef.current);
    resendTimerRef.current = window.setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendTimerRef.current) window.clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const payload = method === 'phone'
        ? { phone: identifier }
        : { email: identifier };
      const result = await forgotPasswordApi(payload);
      setSuccess(result.message || 'Code envoyé !');
      startResendCooldown();
      onNavigate('forgot_otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !identifier.trim()) return;
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const payload = method === 'phone'
        ? { phone: identifier }
        : { email: identifier };
      const result = await forgotPasswordApi(payload);
      setSuccess(result.message || 'Code renvoyé !');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Veuillez saisir le code à 6 chiffres reçu par SMS ou email.');
      return;
    }
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError('Le code doit contenir uniquement 6 chiffres.');
      return;
    }
    onNavigate('reset_password');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsLoading(true);
    try {
      const payload = method === 'phone'
        ? { phone: identifier, code: otp.trim(), newPassword }
        : { email: identifier, code: otp.trim(), newPassword };
      await resetPasswordApi(payload);
      alert('Mot de passe réinitialisé avec succès !');
      onNavigate('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Réinitialisation impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClass = (extra?: string) =>
    `btn-omio w-full py-3 font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${extra || ''}`;

  return (
    <div className="auth-glass-form rounded-2xl p-7 text-white auth-fade-in">
      {error && <p className="mb-4 text-xs font-semibold text-rose-300" role="alert">{error}</p>}
      {success && <p className="mb-4 text-xs font-semibold text-emerald-300">{success}</p>}

      {screen === 'forgot_phone' && (
        <div>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">{t.phoneTitle}</h2>
            <p className="text-xs text-slate-300 mt-1">{t.phoneSubtitle}</p>
          </div>

          <div className="flex rounded-xl overflow-hidden border border-white/10 mb-4">
            <button
              type="button"
              onClick={() => setMethod('phone')}
              className={`flex-1 py-2 text-xs font-bold transition ${method === 'phone' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              📱 SMS
            </button>
            <button
              type="button"
              onClick={() => setMethod('email')}
              className={`flex-1 py-2 text-xs font-bold transition ${method === 'email' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              ✉️ Email
            </button>
          </div>

          <form onSubmit={handleIdentifierSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 mb-1 block font-medium">
                {method === 'phone' ? 'Numéro de téléphone' : 'Adresse email'}
              </label>
              <input
                required
                type={method === 'phone' ? 'tel' : 'email'}
                placeholder={method === 'phone' ? '07 00 00 00 00' : 'vous@exemple.com'}
                className="auth-input w-full p-3 rounded-xl text-sm"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button type="submit" disabled={isLoading} className={buttonClass()}>
              {isLoading ? 'Envoi en cours...' : t.sendCodeBtn}
            </button>
          </form>
        </div>
      )}

      {screen === 'forgot_otp' && (
        <div>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">{t.otpTitle}</h2>
            <p className="text-xs text-slate-300 mt-1">
              {t.otpSubtitle} <span className="font-bold text-blue-400">{identifier}</span>
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <input
              required
              type="text"
              maxLength={6}
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="Ex: 839210"
              className="auth-input w-full p-3 rounded-xl text-center text-lg tracking-widest font-black text-rose-400"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={isLoading}
            />

            <button type="submit" disabled={isLoading} className={buttonClass()}>
              {isLoading ? 'Vérification...' : t.verifyBtn}
            </button>

            <div className="flex flex-col items-center gap-2 mt-2">
              {resendCooldown > 0 ? (
                <span className="text-xs text-slate-500">
                  Renvoyer dans {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline transition disabled:opacity-50"
                >
                  {isLoading ? 'Envoi...' : t.resendCode}
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('forgot_phone')}
                className="text-xs text-slate-400 hover:text-white underline transition"
              >
                Changer de numéro/email
              </button>
            </div>
          </form>
        </div>
      )}

      {screen === 'reset_password' && (
        <div>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">{t.resetTitle}</h2>
            <p className="text-xs text-slate-300 mt-1">{t.resetSubtitle}</p>
          </div>

          <form onSubmit={handleResetSubmit} className="space-y-3">
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder={t.newPassword}
                minLength={8}
                className="auth-input w-full p-3 rounded-xl text-xs pr-10"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder={t.confirmPassword}
                minLength={8}
                className="auth-input w-full p-3 rounded-xl text-xs pr-10"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="togglePasswordReset"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="togglePasswordReset" className="text-xs text-slate-300 cursor-pointer select-none">
                Afficher le nouveau mot de passe
              </label>
            </div>

            <button type="submit" disabled={isLoading} className={buttonClass('text-xs mt-2')}>
              {isLoading ? 'Enregistrement...' : t.resetBtn}
            </button>
          </form>
        </div>
      )}

      <div className="text-center mt-5 pt-3 border-t border-white/10">
        <button
          onClick={() => onNavigate('login')}
          className="text-xs text-blue-400 font-semibold hover:underline"
        >
          Retour à la page de connexion
        </button>
      </div>
    </div>
  );
}
