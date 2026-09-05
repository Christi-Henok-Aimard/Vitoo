import { useNavigate } from 'react-router-dom';
import { sessionKeyForSpace, loadStoredSession } from '../api/sessionKeys';

export const DevLanding: React.FC = () => {
  const navigate = useNavigate();

  const session = (space: 'passenger' | 'company' | 'admin') => {
    const s = loadStoredSession(sessionKeyForSpace(space));
    return s && typeof s === 'object' ? s : null;
  };

  const handlePassengerLogin = () => navigate('/passenger');

  const handleCompanyLogin = () => navigate('/company');

  const handleDriverLogin = () => {
    const s = session('passenger') as { driverSpace?: unknown } | null;
    navigate(s?.driverSpace ? '/driver' : '/passenger');
  };

  const handleAdminLogin = () => navigate('/admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-rose-400 flex items-center justify-center font-black text-white text-2xl">V</div>
            <span className="text-2xl font-black tracking-wider text-white">VITOO</span>
          </div>
          <h1 className="text-3xl font-black text-white">Développement</h1>
          <p className="text-slate-400 mt-2">Choisissez un espace. Chaque bouton ouvre le vrai écran de connexion de l'espace — aucun compte n'est créé automatiquement.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={handlePassengerLogin}
            className="bg-white rounded-2xl p-6 text-left hover:shadow-xl transition-shadow border border-slate-200"
          >
            <div className="text-3xl mb-3">🎫</div>
            <h2 className="text-xl font-bold text-slate-900">Espace Passager</h2>
            <p className="text-sm text-slate-500 mt-1">Rechercher et réserver des trajets</p>
            <div className="mt-4 text-sm font-bold text-vitoo-blue">Accéder →</div>
          </button>

          <button
            onClick={handleCompanyLogin}
            className="bg-white rounded-2xl p-6 text-left hover:shadow-xl transition-shadow border border-slate-200"
          >
            <div className="text-3xl mb-3">🏢</div>
            <h2 className="text-xl font-bold text-slate-900">Espace Compagnie</h2>
            <p className="text-sm text-slate-500 mt-1">Gérer trajets, chauffeurs et véhicules</p>
            <div className="mt-4 text-sm font-bold text-vitoo-blue">Accéder →</div>
          </button>

          <button
            onClick={handleDriverLogin}
            className="bg-white rounded-2xl p-6 text-left hover:shadow-xl transition-shadow border border-slate-200"
          >
            <div className="text-3xl mb-3">🚌</div>
            <h2 className="text-xl font-bold text-slate-900">Espace Chauffeur</h2>
            <p className="text-sm text-slate-500 mt-1">Accès via le compte passager du chauffeur</p>
            <div className="mt-4 text-sm font-bold text-vitoo-blue">Accéder →</div>
          </button>

          <button
            onClick={handleAdminLogin}
            className="bg-white rounded-2xl p-6 text-left hover:shadow-xl transition-shadow border border-slate-200"
          >
            <div className="text-3xl mb-3">🛡️</div>
            <h2 className="text-xl font-bold text-slate-900">Admin Vitoo</h2>
            <p className="text-sm text-slate-500 mt-1">Gérer comptes, trajets et données</p>
            <div className="mt-4 text-sm font-bold text-vitoo-blue">Accéder →</div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Session réelle par espace : passager, compagnie et admin gardent chacun leur connexion.
          </p>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="mt-2 text-xs text-slate-400 underline hover:text-white"
          >
            Effacer le stockage local
          </button>
        </div>
      </div>
    </div>
  );
};