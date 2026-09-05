import { useState } from 'react';
import CompanyRegisterForm from './components/CompanyRegisterForm';
import CompanyLoginForm from './components/CompanyLoginForm';
import CompanyForgotPasswordForm from './components/CompanyForgotPasswordForm';
import type { UserSession } from '../passenger/types/auth';

type CompanyAuthScreen = 'login' | 'register' | 'forgot_email' | 'forgot_otp' | 'reset_password';

interface Props {
  onLoginSuccess: (user: UserSession) => void;
}

export default function CompanyAuthContainer({ onLoginSuccess }: Props) {
  const [screen, setScreen] = useState<CompanyAuthScreen>('login');

  return (
    <div className="auth-main-card">
      <section className="auth-visual">
        <div>
          <div className="brand-lockup">
            <div className="brand-mark">V</div>
            <span className="brand-word">VITOO</span>
          </div>
        </div>
        <div className="auth-visual-copy">
          <span className="hero-eyebrow">Espace Compagnie</span>
          <h1>Gérez votre flotte, simplement.</h1>
          <p>Programmez vos trajets, assignez vos chauffeurs et suivez vos ventes en temps réel.</p>
          <div className="auth-benefits">
            <span className="auth-benefit">Gestion complète de vos départs</span>
            <span className="auth-benefit">Suivi en direct de vos véhicules</span>
            <span className="auth-benefit">Ventes au guichet et en ligne</span>
            <span className="auth-benefit">Statistiques et commissions automatiques</span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="w-full max-w-md">
          {screen === 'register' && (
            <CompanyRegisterForm
              onNavigate={setScreen}
              onLoginSuccess={onLoginSuccess}
            />
          )}

          {screen === 'login' && (
            <CompanyLoginForm
              onNavigate={setScreen}
              onLoginSuccess={onLoginSuccess}
            />
          )}

          {(screen === 'forgot_email' || screen === 'forgot_otp' || screen === 'reset_password') && (
            <CompanyForgotPasswordForm
              onNavigate={setScreen}
              onLoginSuccess={onLoginSuccess}
            />
          )}
        </div>
      </section>
    </div>
  );
}
