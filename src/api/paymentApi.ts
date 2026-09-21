import type { Booking } from '../types/booking';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const STORAGE_KEY = 'vitoo_session';

const authHeaders = (): HeadersInit => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const token = raw ? (JSON.parse(raw) as { token?: string }).token : null;
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

export interface InitiatePaymentResult {
  paymentId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
}

export interface PaymentStatusResult {
  payment: {
    id: string;
    status: string;
    provider: string;
    amount: number;
    currency: string;
    channel?: string;
    errorMessage?: string;
  };
  booking: Booking | null;
}

export type ConfirmPaymentResult = {
  status: 'paid' | 'failed' | 'pending';
  booking?: Booking;
  message?: string;
};

// 1) Initie le paiement en ligne (CinetPay) : renvoie l'URL du guichet de paiement.
export const initiatePaymentApi = async (input: {
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  method: string;
}): Promise<InitiatePaymentResult> => {
  const response = await fetch(`${API_BASE}/payments/initiate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as Partial<InitiatePaymentResult> & { message?: string };
  if (!response.ok) throw new Error(data.message || 'Impossible d\'initialiser le paiement.');
  return data as InitiatePaymentResult;
};

// 2) Statut d'un paiement après retour du guichet.
export const getPaymentApi = async (paymentId: string): Promise<PaymentStatusResult> => {
  const response = await fetch(`${API_BASE}/payments/${paymentId}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Paiement introuvable.');
  return (await response.json()) as PaymentStatusResult;
};

// 3) Confirme / finalise le paiement (vérification serveur + création du billet).
export const confirmPaymentApi = async (paymentId: string): Promise<ConfirmPaymentResult> => {
  const response = await fetch(`${API_BASE}/payments/${paymentId}/confirm`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = (await response.json()) as ConfirmPaymentResult & { message?: string };
  if (!response.ok) throw new Error(data.message || 'Impossible de confirmer le paiement.');
  return data;
};

// Billet persisté après un paiement en ligne (pour l'affichage dès le retour).
const LAST_BOOKING_KEY = 'vitoo_last_booking';

export const saveLastBooking = (booking: Booking): void => {
  try {
    localStorage.setItem(LAST_BOOKING_KEY, JSON.stringify(booking));
  } catch {
    // stockage indisponible
  }
};

export const loadLastBooking = (): Booking | null => {
  try {
    const raw = localStorage.getItem(LAST_BOOKING_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  } catch {
    return null;
  }
};

export const clearLastBooking = (): void => {
  try {
    localStorage.removeItem(LAST_BOOKING_KEY);
  } catch {
    // stockage indisponible
  }
};