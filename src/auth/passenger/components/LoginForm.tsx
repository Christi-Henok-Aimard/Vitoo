// import React, { useState } from 'react';
// import { AUTH_TEXTS } from '../constants/authText';
// import type { UserSession, AuthScreen } from '../types/auth';

// interface Props {
//   onNavigate: (screen: AuthScreen) => void;
//   onLoginSuccess: (user: UserSession) => void;
// }

// export default function LoginForm({ onNavigate, onLoginSuccess }: Props) {
//   const [phone, setPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const t = AUTH_TEXTS.login;

//   const handleLogin = (e: React.FormEvent) => {
//     e.preventDefault();
//     onLoginSuccess({
//       id: '1', firstName: 'Henok', lastName: 'Aïmard', phone, city: 'Abidjan', role: 'passenger'
//     });
//   };

//   return (
//     <div className="auth-glass-form rounded-2xl p-7 text-white auth-fade-in">
//       <div className="mb-6">
//         <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
//           {t.title}
//           <span className="w-6 h-0.5 bg-rose-400 inline-block rounded-full"></span>
//         </h2>
//         <p className="text-xs text-slate-300 mt-1">{t.subtitle}</p>
//       </div>

//       <form onSubmit={handleLogin} className="space-y-4">
//         <div>
//           <label className="text-xs text-slate-300 font-medium mb-1 block">{t.phone}</label>
//           <input 
//             required 
//             type="tel" 
//             placeholder="07 00 00 00 00" 
//             className="auth-input w-full p-3 rounded-xl text-sm" 
//             value={phone} 
//             onChange={e => setPhone(e.target.value)} 
//           />
//         </div>
        
//         <div>
//           <label className="text-xs text-slate-300 font-medium mb-1 block">{t.password}</label>
//           <div className="relative">
//             <input 
//               required 
//               type={showPassword ? "text" : "password"} 
//               placeholder="••••••••" 
//               className="auth-input w-full p-3 pr-10 rounded-xl text-sm" 
//               value={password} 
//               onChange={e => setPassword(e.target.value)} 
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
//               title={showPassword ? "Masquer" : "Afficher"}
//             >
//               {showPassword ? (
//                 /* Icône Œil Barré (Masquer) */
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908A8.959 8.959 0 0112 3c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
//                 </svg>
//               ) : (
//                 /* Icône Œil (Afficher) */
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                 </svg>
//               )}
//             </button>
//           </div>
//           <div className="text-right mt-1.5">
//             <button 
//               type="button" 
//               onClick={() => onNavigate('forgot_phone')} 
//               className="text-xs text-slate-300 hover:text-rose-400 transition"
//             >
//               {t.forgotPassword}
//             </button>
//           </div>
//         </div>

//         <button type="submit" className="btn-omio w-full py-3 font-bold rounded-xl text-sm mt-2">
//           {t.submitBtn}
//         </button>
//       </form>

//       <p className="text-center text-xs text-slate-300 mt-6">
//         {t.noAccount} <button onClick={() => onNavigate('register')} className="text-blue-400 font-bold hover:underline">{t.registerLink}</button>
//       </p>
//     </div>
//   );
// }

import React, { useState } from 'react';
import { AUTH_TEXTS } from '../constants/authText';
import type { UserSession, AuthScreen } from '../types/auth';
import { loginApi, googleLoginApi } from '../../../api/authApi';
import { GoogleLoginButton } from './GoogleLoginButton';

interface Props {
  onNavigate: (screen: AuthScreen) => void;
  onLoginSuccess: (user: UserSession) => void;
}

export default function LoginForm({ onNavigate, onLoginSuccess }: Props) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const t = AUTH_TEXTS.login;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { user, token } = await loginApi(phone, password);
      onLoginSuccess({ ...user, token });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setError('');
    setIsLoading(true);
    try {
      const { user, token } = await googleLoginApi(idToken);
      onLoginSuccess({ ...user, token });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion Google impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-glass-form rounded-2xl p-7 text-white auth-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          {t.title}
          <span className="w-6 h-0.5 bg-rose-400 inline-block rounded-full"></span>
        </h2>
        <p className="text-xs text-slate-300 mt-1">{t.subtitle}</p>
      </div>

      <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={(err) => setError(err.message)} />

      {error && <p className="mb-4 text-xs font-semibold text-rose-300" role="alert">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-xs text-slate-300 font-medium mb-1 block">{t.phone}</label>
          <input 
            required 
            type="tel" 
            placeholder="07 00 00 00 00" 
            className="auth-input w-full p-3 rounded-xl text-sm" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
          />
        </div>
        
        <div>
          <label className="text-xs text-slate-300 font-medium mb-1 block">{t.password}</label>
          <div className="relative">
            <input 
              required 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              className="auth-input w-full p-3 pr-10 rounded-xl text-sm" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              title={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908A8.959 8.959 0 0112 3c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <div className="text-right mt-1.5">
            <button 
              type="button" 
              onClick={() => onNavigate('forgot_phone')} 
              className="text-xs text-slate-300 hover:text-rose-400 transition"
            >
              {t.forgotPassword}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-omio w-full py-3 font-bold rounded-xl text-sm mt-2" disabled={isLoading}>
          {isLoading ? 'Connexion en cours...' : t.submitBtn}
        </button>
      </form>

      <p className="text-center text-xs text-slate-300 mt-6">
        {t.noAccount} <button onClick={() => onNavigate('register')} className="text-blue-400 font-bold hover:underline">{t.registerLink}</button>
      </p>
    </div>
  );
}
