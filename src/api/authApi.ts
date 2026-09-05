import type { UserSession } from '../auth/passenger/types/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const STORAGE_KEY = 'vitoo_session';

const getStoredToken = (): string | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token || null;
  } catch {
    return null;
  }
};

const authHeaders = (): HeadersInit => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface RegisterInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  city: string;
  password: string;
}

export interface AuthResponse {
  user: UserSession;
  token: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  city?: string;
  phone?: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok) {
    const message = data.message || 'Une erreur est survenue.';
    throw new Error(message);
  }
  return data as T;
};

export const registerApi = async (input: RegisterInput): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<AuthResponse>(response);
};

export const loginApi = async (phone: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  return handleResponse<AuthResponse>(response);
};

export const googleLoginApi = async (idToken: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  return handleResponse<AuthResponse>(response);
};

export const getMeApi = async (): Promise<{ user: UserSession }> => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse<{ user: UserSession }>(response);
};

export interface CompanyMessage {
  id: string;
  companyId: string;
  companyName: string;
  tripId?: string;
  sender: 'driver' | 'company';
  body: string;
  read: boolean;
  createdAt: string;
}

export const getMyMessagesApi = async (): Promise<{ messages: CompanyMessage[] }> => {
  const response = await fetch(`${API_BASE}/auth/me/messages`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse<{ messages: CompanyMessage[] }>(response);
};

export const updateMeApi = async (input: UpdateProfileInput): Promise<{ user: UserSession }> => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  return handleResponse<{ user: UserSession }>(response);
};

export const updatePasswordApi = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/auth/me/password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse<{ message: string }>(response);
};

export interface ForgotPasswordInput {
  phone?: string;
  email?: string;
}

export interface ResetPasswordInput {
  phone?: string;
  email?: string;
  code: string;
  newPassword: string;
}

export const forgotPasswordApi = async ({ phone, email }: ForgotPasswordInput): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Erreur lors de l'envoi du code.");
  return data;
};

export const resetPasswordApi = async ({ phone, email, code, newPassword }: ResetPasswordInput): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, email, code, newPassword }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Réinitialisation impossible.');
  return data;
};
