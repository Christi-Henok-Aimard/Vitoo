// import React, { useState } from 'react';
// import { AUTH_TEXTS } from '../constants/authText';
// import type { AuthScreen } from '../types/auth';

// interface Props {
//   onNavigate: (screen: AuthScreen) => void;
// }

// export default function RegisterForm({ onNavigate }: Props) {
//   const [formData, setFormData] = useState({
//     lastName: '', firstName: '', phone: '', email: '', city: '', password: '', confirmPassword: ''
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const t = AUTH_TEXTS.register;

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (formData.password !== formData.confirmPassword) {
//       alert("Les mots de passe ne correspondent pas");
//       return;
//     }
//     onNavigate('login');
//   };

//   return (
//     <div className="auth-glass-form rounded-2xl p-7 text-white auth-fade-in">
//       <div className="mb-5">
//         <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
//           {t.title}
//           <span className="w-6 h-0.5 bg-blue-400 inline-block rounded-full"></span>
//         </h2>
//         <p className="text-xs text-slate-300 mt-1">{t.subtitle}</p>
//       </div>

//       <button type="button" className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 font-medium text-xs flex items-center justify-center gap-3 transition mb-4 text-slate-200">
//         <svg className="w-4 h-4" viewBox="0 0 24 24">
//           <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
//           <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//           <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
//           <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
//         </svg>
//         {t.googleBtn}
//       </button>

//       <form onSubmit={handleSubmit} className="space-y-3">
//         <div className="grid grid-cols-2 gap-2.5">
//           <input required type="text" placeholder={t.lastName} className="auth-input p-2.5 rounded-xl text-xs" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
//           <input required type="text" placeholder={t.firstName} className="auth-input p-2.5 rounded-xl text-xs" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
//         </div>

//         <input required type="tel" placeholder={t.phone} className="auth-input w-full p-2.5 rounded-xl text-xs" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
//         <input required type="text" placeholder={t.city} className="auth-input w-full p-2.5 rounded-xl text-xs" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />

//         {/* Mots de passe avec bouton œil pour afficher/masquer */}
//         <div className="grid grid-cols-2 gap-2.5">
//           <div className="relative">
//             <input 
//               required 
//               type={showPassword ? "text" : "password"} 
//               placeholder={t.password} 
//               className="auth-input w-full p-2.5 pr-8 rounded-xl text-xs" 
//               value={formData.password} 
//               onChange={e => setFormData({...formData, password: e.target.value})} 
//             />
//           </div>
//           <div className="relative">
//             <input 
//               required 
//               type={showPassword ? "text" : "password"} 
//               placeholder={t.confirmPassword} 
//               className="auth-input w-full p-2.5 pr-8 rounded-xl text-xs" 
//               value={formData.confirmPassword} 
//               onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
//             />
//           </div>
//         </div>

//         {/* Case à cocher global pour la visibilité des mots de passe */}
//         <div className="flex items-center gap-2 pt-1">
//           <input 
//             type="checkbox" 
//             id="togglePasswordReg" 
//             checked={showPassword} 
//             onChange={() => setShowPassword(!showPassword)}
//             className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-0 cursor-pointer"
//           />
//           <label htmlFor="togglePasswordReg" className="text-xs text-slate-300 cursor-pointer select-none">
//             Afficher les mots de passe
//           </label>
//         </div>

//         <button type="submit" className="btn-omio w-full py-3 font-bold rounded-xl text-xs mt-2">
//           {t.submitBtn}
//         </button>
//       </form>

//       <p className="text-center text-xs text-slate-300 mt-4">
//         {t.hasAccount} <button onClick={() => onNavigate('login')} className="text-blue-400 font-bold hover:underline">{t.loginLink}</button>
//       </p>
//     </div>
//   );
// }


import React, { useState } from 'react';
import { AUTH_TEXTS } from '../constants/authText';
import type { AuthScreen, UserSession } from '../types/auth';
import { registerApi, googleLoginApi } from '../../../api/authApi';
import { GoogleLoginButton } from './GoogleLoginButton';

interface Props {
  onNavigate: (screen: AuthScreen) => void;
  onLoginSuccess: (user: UserSession) => void;
}

export default function RegisterForm({ onNavigate, onLoginSuccess }: Props) {
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', phone: '', email: '', city: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const t = AUTH_TEXTS.register;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsLoading(true);
    try {
      const { user, token } = await registerApi({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email || undefined,
        city: formData.city,
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
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          {t.title}
          <span className="w-6 h-0.5 bg-blue-400 inline-block rounded-full"></span>
        </h2>
        <p className="text-xs text-slate-300 mt-1">{t.subtitle}</p>
      </div>

      <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={(err) => setError(err.message)} />

      {error && <p className="mb-4 text-xs font-semibold text-rose-300" role="alert">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <input required type="text" placeholder={t.lastName} className="auth-input p-2.5 rounded-xl text-xs" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          <input required type="text" placeholder={t.firstName} className="auth-input p-2.5 rounded-xl text-xs" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
        </div>

        <input required type="tel" placeholder={t.phone} className="auth-input w-full p-2.5 rounded-xl text-xs" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <input required type="text" placeholder={t.city} className="auth-input w-full p-2.5 rounded-xl text-xs" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />

        {/* Mots de passe */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="relative">
            <input 
              required 
              type={showPassword ? "text" : "password"} 
              placeholder={t.password} 
              className="auth-input w-full p-2.5 pr-8 rounded-xl text-xs" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>
          <div className="relative">
            <input 
              required 
              type={showPassword ? "text" : "password"} 
              placeholder={t.confirmPassword} 
              className="auth-input w-full p-2.5 pr-8 rounded-xl text-xs" 
              value={formData.confirmPassword} 
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
            />
          </div>
        </div>

        {/* Case à cocher pour afficher/masquer le mot de passe */}
        <div className="flex items-center gap-2 pt-1">
          <input 
            type="checkbox" 
            id="togglePasswordReg" 
            checked={showPassword} 
            onChange={() => setShowPassword(!showPassword)}
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="togglePasswordReg" className="text-xs text-slate-300 cursor-pointer select-none">
            Afficher les mots de passe
          </label>
        </div>

        <button type="submit" className="btn-omio w-full py-3 font-bold rounded-xl text-xs mt-2" disabled={isLoading}>
          {isLoading ? 'Inscription en cours...' : t.submitBtn}
        </button>
      </form>

      <p className="text-center text-xs text-slate-300 mt-4">
        {t.hasAccount} <button onClick={() => onNavigate('login')} className="text-blue-400 font-bold hover:underline">{t.loginLink}</button>
      </p>
    </div>
  );
}
