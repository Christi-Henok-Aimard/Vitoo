import React, { useState } from 'react';
import { Phone, ArrowLeft } from 'lucide-react';

interface DriverForgotPasswordFormProps {
  onBack: () => void;
}

export const DriverForgotPasswordForm: React.FC<DriverForgotPasswordFormProps> = ({ onBack }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { driverForgotPasswordApi } = await import('../../api/driverApi');
      await driverForgotPasswordApi(phone);
      setMessage('Si ce numéro existe, un code de vérification a été envoyé.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <button type="button" onClick={onBack} className="back-link"><ArrowLeft size={16} /> Retour</button>
      <div className="auth-header">
        <div className="auth-icon"><Phone size={32} /></div>
        <h1>Mot de passe oublié</h1>
        <p>Entrez votre numéro de téléphone</p>
      </div>

      {message && <div className="auth-error">{message}</div>}

      <div className="form-group">
        <label><Phone size={16} /> Téléphone</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 01 00 00 00 00" required />
      </div>

      <button type="submit" className="auth-button" disabled={isLoading}>
        {isLoading ? 'Envoi...' : 'Envoyer le code'}
      </button>
    </form>
  );
};
