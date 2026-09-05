export const PASSENGER_SESSION_KEY = 'vitoo_session';
export const COMPANY_SESSION_KEY = 'vitoo_company_session';
export const ADMIN_SESSION_KEY = 'vitoo_admin_session';
export const ACTIVE_SPACE_KEY = 'vitoo_active_space';

export type ActiveSpace = 'passenger' | 'company' | 'admin';

export const roleToSpace = (role?: string): ActiveSpace =>
  role === 'company' ? 'company' : role === 'admin' ? 'admin' : 'passenger';

export const sessionKeyForSpace = (space: ActiveSpace): string =>
  space === 'company' ? COMPANY_SESSION_KEY : space === 'admin' ? ADMIN_SESSION_KEY : PASSENGER_SESSION_KEY;

export const loadStoredSession = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const saveStoredSession = (key: string, session: unknown): void => {
  const value = typeof session === 'string' ? session : JSON.stringify(session);
  localStorage.setItem(key, value);
};

export const clearStoredSession = (key: string): void => {
  localStorage.removeItem(key);
};

export const fireSessionStored = (space: ActiveSpace): void => {
  window.dispatchEvent(new CustomEvent('vitoo-session-stored', { detail: { space } }));
};

export const fireSessionExpired = (space: ActiveSpace): void => {
  window.dispatchEvent(new CustomEvent('vitoo-auth-expired', { detail: { space } }));
};