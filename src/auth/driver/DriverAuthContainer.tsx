import React, { useState } from 'react';
import { DriverLoginForm } from './DriverLoginForm';
import { DriverRegisterForm } from './DriverRegisterForm';
import { DriverForgotPasswordForm } from './DriverForgotPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot-password';

interface DriverAuthContainerProps {
  onLoginSuccess: (session: { driver: unknown; token: string }) => void;
}

export const DriverAuthContainer: React.FC<DriverAuthContainerProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="auth-page">
      <div className="auth-card">
        {mode === 'login' && <DriverLoginForm onLoginSuccess={onLoginSuccess} onSwitchToRegister={() => setMode('register')} onForgotPassword={() => setMode('forgot-password')} />}
        {mode === 'register' && <DriverRegisterForm onRegisterSuccess={onLoginSuccess} onSwitchToLogin={() => setMode('login')} />}
        {mode === 'forgot-password' && <DriverForgotPasswordForm onBack={() => setMode('login')} />}
      </div>
    </div>
  );
};
