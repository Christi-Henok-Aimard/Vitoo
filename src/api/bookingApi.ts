import type { Booking, BookingRequest } from '../types/booking';

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

// Réservation + paiement. Le backend valide, décrémente les places et renvoie le billet.
export const createBookingApi = async (request: BookingRequest): Promise<Booking> => {
  const response = await fetch(`${API_BASE}/trips/${request.tripId}/bookings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      passengerName: request.passengerName,
      passengerPhone: request.passengerPhone,
      paymentMethod: request.paymentMethod,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Échec du paiement / réservation.');
  return data.booking as Booking;
};

// Mes réservations (billets actifs + historique) depuis le serveur.
export const fetchMyBookingsApi = async (): Promise<Booking[]> => {
  const response = await fetch(`${API_BASE}/trips/bookings/mine`, { headers: authHeaders() });
  if (!response.ok) return [];
  const data = (await response.json()) as { bookings: Booking[] };
  return data.bookings;
};

// Arrivée à destination : la réservation passe en "completed" côté serveur.
export const completeBookingApi = async (bookingId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/trips/bookings/${bookingId}/complete`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Impossible de terminer le trajet.');
  }
};

// Envoie un avis (notes / commentaire) pour un trajet effectué.
export const rateTripApi = async (tripId: string, stars: number, comment?: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/trips/${tripId}/rating`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ stars, comment }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Impossible d\'envoyer votre avis.');
  }
};
