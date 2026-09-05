import React, { useState } from 'react';
import { Phone, Lock, User } from 'lucide-react';

interface DriverLoginFormProps {
  onLoginSuccess: (session: { driver: unknown; token: string }) => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

export const DriverLoginForm: React.FC<DriverLoginFormProps> = ({ onLoginSuccess, onSwitchToRegister, onForgotPassword }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { driverLoginApi } = await import('../../api/driverApi');
      const result = await driverLoginApi(phone, password);
      onLoginSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="auth-header">
        <div className="auth-icon"><User size={32} /></div>
        <h1>Espace Chauffeur</h1>
        <p>Connectez-vous pour voir vos missions</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="form-group">
        <label><Phone size={16} /> Téléphone</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 01 00 00 00 00" required />
      </div>

      <div className="form-group">
        <label><Lock size={16} /> Mot de passe</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
      </div>

      <button type="submit" className="auth-button" disabled={isLoading}>
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </button>

      <div className="auth-links">
        <button type="button" onClick={onForgotPassword}>Mot de passe oublié ?</button>
        <button type="button" onClick={onSwitchToRegister}>Créer un compte</button>
      </div>
    </form>
  );
};
