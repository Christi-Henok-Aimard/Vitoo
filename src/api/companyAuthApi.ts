import type { UserSession } from '../auth/passenger/types/auth';
import { COMPANY_SESSION_KEY } from './sessionKeys';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const authHeaders = (): HeadersInit => {
  const raw = localStorage.getItem(COMPANY_SESSION_KEY);
  const token = raw ? (JSON.parse(raw) as { token?: string }).token : undefined;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export interface CompanyRegisterData {
  companyName: string;
  rccm: string;
  taxId: string;
  city: string;
  contactName: string;
  phone: string;
  email: string;
  password: string;
}

export const companyRegisterApi = async (data: CompanyRegisterData): Promise<{ user: UserSession; token: string }> => {
  const response = await fetch(`${API_BASE}/company/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Inscription impossible.');
  return result;
};

export const companyLoginApi = async (email: string, password: string): Promise<{ user: UserSession; token: string }> => {
  const response = await fetch(`${API_BASE}/company/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Connexion impossible.');
  return result;
};

export interface CompanyForgotPasswordInput {
  email?: string;
  phone?: string;
}

export interface CompanyResetPasswordInput {
  email?: string;
  phone?: string;
  code: string;
  newPassword: string;
}

export const companyForgotPasswordApi = async ({ email, phone }: CompanyForgotPasswordInput): Promise<void> => {
  const response = await fetch(`${API_BASE}/company/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Erreur.');
};

export const companyGoogleLoginApi = async (idToken: string): Promise<{ user: UserSession; token: string }> => {
  const response = await fetch(`${API_BASE}/company/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Connexion Google impossible.');
  return result;
};

export const companyResetPasswordApi = async ({ email, phone, code, newPassword }: CompanyResetPasswordInput): Promise<void> => {
  const response = await fetch(`${API_BASE}/company/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone, code, newPassword }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Réinitialisation impossible.');
};

export const updateCompanyProfileApi = async (data: Record<string, unknown>): Promise<UserSession> => {
  const response = await fetch(`${API_BASE}/company/auth/me`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) });
  const result = await response.json() as { user?: UserSession; message?: string };
  if (!response.ok || !result.user) throw new Error(result.message || 'Mise à jour impossible.');
  return result.user;
};

export const getCompanyProfileApi = async (): Promise<UserSession> => {
  const response = await fetch(`${API_BASE}/company/auth/me`, { headers: authHeaders() });
  const result = await response.json() as { user?: UserSession; message?: string };
  if (!response.ok || !result.user) throw new Error(result.message || 'Impossible de charger le profil.');
  return result.user;
};
