// import { useState } from 'react';
// import RegisterForm from './components/RegisterForm';
// import LoginForm from './components/LoginForm';
// import ForgotPasswordForm from './components/ForgotPasswordForm';
// import type { AuthScreen, UserSession } from './types/auth';

// interface Props {
//   onLoginSuccess: (user: UserSession) => void;
// }

// export default function AuthContainer({ onLoginSuccess }: Props) {
//   const [screen, setScreen] = useState<AuthScreen>('register');
//   const [phone, setPhone] = useState('');

//   return (
//     <div className="min-h-screen auth-bg-gradient flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
//       {/* Motifs abstraits d'arrière-plan (lignes et formes douces) */}
//       <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
//       <div className="absolute bottom-10 right-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

//       {/* Cadre Principal à 2 Colonnes */}
//       <div className="w-full max-w-5xl auth-main-card rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
//         {/* PANNEAU DE GAUCHE : Presentation & Marque (Style Welcome!) */}
//         <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between relative bg-gradient-to-br from-white/[0.03] to-transparent">
//           <div>
//             {/* Logo VITOO */}
//             <div className="flex items-center gap-2 mb-12">
//               <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-500 to-rose-400 flex items-center justify-center font-black text-white text-xl shadow-lg">
//                 V
//               </div>
//               <span className="text-xl font-bold tracking-wider text-white">VITOO</span>
//             </div>

//             {/* Titre & Message d'accueil */}
//             <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
//               Bienvenue !
//             </h1>
//             <div className="w-12 h-1 bg-linear-to-r from-rose-400 to-blue-500 rounded-full my-4" />
            
//             <p className="text-sm text-slate-300 leading-relaxed mt-4 max-w-sm">
//               Réservez vos tickets de bus et garez vos voyages à travers la Côte d'Ivoire en toute simplicité et sécurité.
//             </p>
//           </div>

//           <div className="mt-8 pt-6 border-t border-white/10">
//             <button 
//               onClick={() => alert("VITOO est la plateforme de mobilité pour simplifier vos déplacements.")}
//               className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/15"
//             >
//               En savoir plus
//             </button>
//           </div>
//         </div>

//         {/* PANNEAU DE DROITE : Formulaire (Sign in / Sign up / Forgot) */}
//         <div className="lg:col-span-7 p-6 sm:p-10 flex items-center justify-center bg-black/10">
//           <div className="w-full max-w-md">
//             {screen === 'register' && <RegisterForm onNavigate={setScreen} />}
//             {screen === 'login' && <LoginForm onNavigate={setScreen} onLoginSuccess={onLoginSuccess} />}
//             {['forgot_phone', 'forgot_otp', 'reset_password'].includes(screen) && (
//               <ForgotPasswordForm 
//                 screen={screen as any} 
//                 onNavigate={setScreen} 
//                 phone={phone} 
//                 setPhone={setPhone} 
//               />
//             )}
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }

import { useState } from 'react';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import type { AuthScreen, UserSession } from './types/auth';

interface Props {
  onLoginSuccess: (user: UserSession) => void;
}

export default function AuthContainer({ onLoginSuccess }: Props) {
  // Changement de l'écran par défaut à 'login' pour arriver direct sur la connexion
  const [screen, setScreen] = useState<AuthScreen>('login');

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
            <span className="hero-eyebrow">Voyagez autrement</span>
            <h1>Le bon trajet commence ici.</h1>
            <p>Comparez les compagnies de transport interurbain et réservez votre place en quelques instants.</p>
            <div className="auth-benefits">
              <span className="auth-benefit">Des départs partout en Côte d'Ivoire</span>
              <span className="auth-benefit">Paiement mobile simple et sécurisé</span>
              <span className="auth-benefit">Billet disponible immédiatement</span>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="w-full max-w-md">
            {screen === 'register' && (
              <RegisterForm 
                onNavigate={setScreen} 
                onLoginSuccess={onLoginSuccess} 
              />
            )}
            
            {screen === 'login' && (
              <LoginForm 
                onNavigate={setScreen} 
                onLoginSuccess={onLoginSuccess} 
              />
            )}
            
            {['forgot_phone', 'forgot_otp', 'reset_password'].includes(screen) && (
              <ForgotPasswordForm 
                screen={screen as 'forgot_phone' | 'forgot_otp' | 'reset_password'} 
                onNavigate={setScreen} 
              />
            )}
          </div>
        </section>
    </div>
  );
}