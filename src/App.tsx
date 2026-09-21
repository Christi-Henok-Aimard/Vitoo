import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthContainer from './auth/passenger/AuthContainer';
import CompanyAuthContainer from './auth/company/CompanyAuthContainer';
import { PassengerDashboard } from './passenger/dashboard/PassengerDashboard';
import { PaymentReturn } from './passenger/payment/PaymentReturn';
import { CompanyDashboard } from './company/dashboard/CompanyDashboard';
import { DriverDashboard } from './driver/dashboard/DriverDashboard';
import { AdminDashboard } from './admin/AdminDashboard';
import { DevLanding } from './dev/DevLanding';
import { MapTest } from './dev/MapTest';
import { SettingsProvider } from './settings/SettingsContext';
import type { UserSession } from './auth/passenger/types/auth';
import {
  PASSENGER_SESSION_KEY,
  COMPANY_SESSION_KEY,
  ADMIN_SESSION_KEY,
  ACTIVE_SPACE_KEY,
  roleToSpace,
  sessionKeyForSpace,
  loadStoredSession,
  saveStoredSession,
  clearStoredSession,
  type ActiveSpace,
} from './api/sessionKeys';

// Session établie pendant cette session de SPA (reset au reload)
let sessionJustLoggedIn = false;
let lastLoggedInSpace: ActiveSpace = 'passenger';

type SpaceSessions = Record<ActiveSpace, UserSession | null>;

const loadInitialSessions = (): SpaceSessions => {
  // Migration : une session legacy stockée dans la clé passager mais d'un autre
  // espace (compagnie/admin) est déplacée vers sa propre clé.
  const legacy = loadStoredSession<UserSession>(PASSENGER_SESSION_KEY);
  if (legacy && legacy.token && roleToSpace(legacy.role) !== 'passenger') {
    saveStoredSession(sessionKeyForSpace(roleToSpace(legacy.role)), legacy);
    clearStoredSession(PASSENGER_SESSION_KEY);
  }
  return {
    passenger: loadStoredSession<UserSession>(PASSENGER_SESSION_KEY),
    company: loadStoredSession<UserSession>(COMPANY_SESSION_KEY),
    admin: loadStoredSession<UserSession>(ADMIN_SESSION_KEY),
  };
};

const activeSpaceStored = (): ActiveSpace | null => loadStoredSession<ActiveSpace>(ACTIVE_SPACE_KEY);

function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [sessions, setSessions] = useState<SpaceSessions>(() => loadInitialSessions());
  const [activeSpace, setActiveSpace] = useState<ActiveSpace | null>(() => activeSpaceStored());

  useEffect(() => {
    const timer = window.setTimeout(() => setIsSplashVisible(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const applySpaceSession = (space: ActiveSpace, session: UserSession | null) => {
    setSessions((prev) => ({ ...prev, [space]: session }));
  };

  const validateSpaceSession = async (space: ActiveSpace): Promise<void> => {
    const key = sessionKeyForSpace(space);
    const stored = loadStoredSession<UserSession>(key);
    if (!stored || !stored.token) return;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
    const endpoint = space === 'company' ? '/company/auth/me'
      : stored.role === 'driver' ? '/driver/auth/me'
        : '/auth/me';
    try {
      const response = await fetch(`${base}${endpoint}`, {
        headers: { Authorization: `Bearer ${stored.token}` },
      });
      if (!response.ok) throw new Error('Session expirée');
      const result = await response.json() as { user?: UserSession };
      const expectedRole = space === 'passenger' ? undefined : (space === 'company' ? 'company' : 'admin');
      if (result.user && (expectedRole === undefined || result.user.role === expectedRole)) {
        const refreshed = { ...stored, ...result.user, token: stored.token };
        saveStoredSession(key, JSON.stringify(refreshed));
        applySpaceSession(space, refreshed);
        return;
      }
      throw new Error('Espace invalide');
    } catch {
      clearStoredSession(key);
      applySpaceSession(space, null);
      if (activeSpaceStored() === space) clearStoredSession(ACTIVE_SPACE_KEY);
    }
  };

  useEffect(() => {
    const validateSessions = async () => {
      await Promise.all([
        validateSpaceSession('passenger'),
        validateSpaceSession('company'),
        validateSpaceSession('admin'),
      ]);
      setIsSessionChecked(true);
    };
    void validateSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleExpiredSession = (event: Event) => {
      const detail = (event as CustomEvent<{ space?: ActiveSpace }>).detail;
      const space = detail?.space ?? 'passenger';
      clearStoredSession(sessionKeyForSpace(space));
      applySpaceSession(space, null);
      if (activeSpaceStored() === space) {
        clearStoredSession(ACTIVE_SPACE_KEY);
        setActiveSpace(null);
      }
      sessionJustLoggedIn = false;
    };
    const handleSessionStored = (event: Event) => {
      const detail = (event as CustomEvent<{ space?: ActiveSpace }>).detail;
      const space = detail?.space ?? 'passenger';
      const stored = loadStoredSession<UserSession>(sessionKeyForSpace(space));
      if (!stored) return;
      sessionJustLoggedIn = true;
      lastLoggedInSpace = space;
      setActiveSpace(space);
      saveStoredSession(ACTIVE_SPACE_KEY, JSON.stringify(space));
      applySpaceSession(space, stored);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return;
      if (event.key && [PASSENGER_SESSION_KEY, COMPANY_SESSION_KEY, ADMIN_SESSION_KEY].includes(event.key)) {
        const space = event.key === COMPANY_SESSION_KEY ? 'company' : event.key === ADMIN_SESSION_KEY ? 'admin' : 'passenger';
        const next = event.newValue ? loadStoredSession<UserSession>(event.key) : null;
        if (next && next.token) {
          applySpaceSession(space, next);
        } else {
          applySpaceSession(space, null);
          if (activeSpaceStored() === space) {
            clearStoredSession(ACTIVE_SPACE_KEY);
            setActiveSpace(null);
          }
        }
      }
    };
    window.addEventListener('vitoo-auth-expired', handleExpiredSession);
    window.addEventListener('vitoo-session-stored', handleSessionStored);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('vitoo-auth-expired', handleExpiredSession);
      window.removeEventListener('vitoo-session-stored', handleSessionStored);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleLoginSuccess = (user: UserSession | { driver: Record<string, unknown>; token: string }) => {
    const session = 'driver' in user ? { ...user.driver, token: user.token, role: 'driver' as const } : user;
    const space = roleToSpace(session.role);
    saveStoredSession(sessionKeyForSpace(space), JSON.stringify(session));
    sessionJustLoggedIn = true;
    lastLoggedInSpace = space;
    setActiveSpace(space);
    saveStoredSession(ACTIVE_SPACE_KEY, JSON.stringify(space));
    applySpaceSession(space, session as UserSession);
  };

  const logoutSpace = (space: ActiveSpace) => {
    clearStoredSession(sessionKeyForSpace(space));
    applySpaceSession(space, null);
    if (activeSpace === space) {
      clearStoredSession(ACTIVE_SPACE_KEY);
      setActiveSpace(null);
    }
    sessionJustLoggedIn = false;
  };

  const handlePassengerUpdate = (updated: UserSession) => {
    applySpaceSession('passenger', updated);
    const stored = loadStoredSession<UserSession>(PASSENGER_SESSION_KEY);
    saveStoredSession(PASSENGER_SESSION_KEY, JSON.stringify({ ...stored, ...updated }));
  };

  const passengerSession = sessions.passenger;
  const companySession = sessions.company;
  const adminSession = sessions.admin;

  if (isSplashVisible || !isSessionChecked) {
    return (
      <main className="splash-screen" aria-label="Chargement de Vitoo">
        <div className="splash-brand">
          <div className="splash-mark">V</div>
          <p className="splash-name">VITOO</p>
          <p className="splash-tagline">Tous vos trajets interurbains, au même endroit.</p>
        </div>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <SettingsProvider>
        <Routes>
          {/* Accueil : en dev, sélecteur d'espaces (DevLanding). En prod, on va
              direct vers l'espace passager (site public). Le sélecteur reste
              accessible sur /dev. */}
          <Route path="/" element={
            sessionJustLoggedIn && sessions[lastLoggedInSpace] ? (
              <Navigate to={`/${lastLoggedInSpace}`} replace />
            ) : import.meta.env.PROD ? (
              <Navigate to="/passenger" replace />
            ) : (
              <DevLanding />
            )
          } />
          <Route path="/dev" element={<DevLanding />} />
          <Route path="/maptest" element={<MapTest />} />

          {/* Espace Passager */}
          <Route path="/passenger/payment-return" element={<PaymentReturn />} />
          <Route path="/passenger/*" element={
            passengerSession && passengerSession.role === 'passenger' ? (
              <PassengerDashboard
                currentUser={passengerSession}
                onLogout={() => logoutSpace('passenger')}
                onCurrentUserChange={handlePassengerUpdate}
              />
            ) : (
              <AuthContainer onLoginSuccess={handleLoginSuccess} />
            )
          } />

          {/* Espace Compagnie */}
          <Route path="/company/*" element={
            companySession && companySession.role === 'company' ? (
              <CompanyDashboard onLogout={() => logoutSpace('company')} />
            ) : (
              <CompanyAuthContainer onLoginSuccess={handleLoginSuccess} />
            )
          } />

          {/* Espace Administrateur */}
          <Route path="/admin/*" element={
            adminSession && adminSession.role === 'admin' ? (
              <AdminDashboard onLogout={() => logoutSpace('admin')} />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          {/* Espace Chauffeur — pas de site ni de login dédié : on y accède depuis le
              compte passager du chauffeur (driverSpace) via le bouton du profil. */}
          <Route path="/driver/*" element={
            passengerSession?.driverSpace ? (
              <DriverDashboard
                currentUser={passengerSession}
                onLogout={() => logoutSpace('passenger')}
                onCurrentUserChange={handlePassengerUpdate}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;