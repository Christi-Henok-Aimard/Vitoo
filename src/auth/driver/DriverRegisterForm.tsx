import React, { useState } from 'react';
import { Phone, Lock, User, Building2 } from 'lucide-react';

interface DriverRegisterFormProps {
  onRegisterSuccess: (session: { driver: unknown; token: string }) => void;
  onSwitchToLogin: () => void;
}

export const DriverRegisterForm: React.FC<DriverRegisterFormProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: '', companyId: '', licenseNumber: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setError('');
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsLoading(true);
    try {
      const { driverRegisterApi } = await import('../../api/driverApi');
      const result = await driverRegisterApi({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        companyId: form.companyId,
        licenseNumber: form.licenseNumber || undefined,
      });
      onRegisterSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="auth-header">
        <div className="auth-icon"><User size={32} /></div>
        <h1>Inscription Chauffeur</h1>
        <p>Rejoignez Vitoo en tant que chauffeur</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label><User size={16} /> Prénom</label>
          <input type="text" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} required />
        </div>
        <div className="form-group">
          <label><User size={16} /> Nom</label>
          <input type="text" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} required />
        </div>
      </div>

      <div className="form-group">
        <label><Phone size={16} /> Téléphone</label>
        <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+225 01 00 00 00 00" required />
      </div>

      <div className="form-group">
        <label><Building2 size={16} /> ID Compagnie</label>
        <input type="text" value={form.companyId} onChange={(e) => updateField('companyId', e.target.value)} placeholder="ID fourni par votre compagnie" required />
      </div>

      <div className="form-group">
        <label><User size={16} /> N° Permis</label>
        <input type="text" value={form.licenseNumber} onChange={(e) => updateField('licenseNumber', e.target.value)} placeholder="Permis de conduire" />
      </div>

      <div className="form-group">
        <label><Lock size={16} /> Mot de passe</label>
        <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="••••••••" required />
      </div>

      <div className="form-group">
        <label><Lock size={16} /> Confirmer le mot de passe</label>
        <input type="password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="••••••••" required />
      </div>

      <button type="submit" className="auth-button" disabled={isLoading}>
        {isLoading ? 'Inscription...' : "S'inscrire"}
      </button>

      <div className="auth-links">
        <span>Déjà un compte ?</span>
        <button type="button" onClick={onSwitchToLogin}>Se connecter</button>
      </div>
    </form>
  );
};
