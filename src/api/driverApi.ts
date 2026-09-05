const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const STORAGE_KEY = 'vitoo_session';

const authHeaders = (): HeadersInit => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as { token?: string; role?: string } : null;
    const token = parsed?.token || null;
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

const publicHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
});

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('vitoo-auth-expired'));
    const message = data.message || 'Une erreur est survenue.';
    throw new Error(message);
  }
  return data as T;
};

export interface DriverAuthUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: 'driver';
  companyId: string;
}

export interface DriverSession {
  token: string;
  driver: DriverAuthUser;
}

export interface TripData {
  id: string;
  companyId: string;
  depart: string;
  arrivee: string;
  station: string;
  time: string;
  date: string;
  duration: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  vehicleId: string;
  driverId: string;
  paymentMethods: string[];
  stops: string[];
  status: 'scheduled' | 'boarding' | 'in_transit' | 'completed' | 'cancelled';
  latitude?: number;
  longitude?: number;
  lastPositionAt?: string;
  company?: string;
  vehicle?: {
    id: string;
    plate: string;
    model: string;
    brand?: string;
    color?: string;
    capacity: number;
  };
}

export interface TicketData {
  id: string;
  tripId: string;
  companyId: string;
  code?: string;
  qrData?: string;
  passengerName: string;
  passengerPhone: string;
  guestEmail?: string;
  seatNumber: string;
  amount: number;
  paymentMethod: string;
  soldBy: 'online' | 'counter';
  commissionRate: number;
  commissionAmount: number;
  companyNet: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  validatedAt?: string;
  createdAt: string;
}

export interface DriverData {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  status: 'available' | 'on_trip' | 'off_duty';
  createdAt: string;
}

export interface VehicleData {
  id: string;
  companyId: string;
  plate: string;
  brand: string;
  model: string;
  capacity: number;
  color?: string;
  status: 'available' | 'in_transit' | 'maintenance';
  createdAt: string;
}

export const driverRegisterApi = async (data: { firstName: string; lastName: string; phone: string; email?: string; password: string; companyId: string; licenseNumber?: string }): Promise<DriverSession> => {
  const response = await fetch(`${API_BASE}/driver/auth/register`, { method: 'POST', headers: publicHeaders(), body: JSON.stringify(data) });
  const result = await handleResponse<{ driver: DriverAuthUser; token: string }>(response);
  return { driver: result.driver, token: result.token };
};

export const driverLoginApi = async (phone: string, password: string): Promise<DriverSession> => {
  const response = await fetch(`${API_BASE}/driver/auth/login`, { method: 'POST', headers: publicHeaders(), body: JSON.stringify({ phone, password }) });
  const result = await handleResponse<{ driver: DriverAuthUser; token: string }>(response);
  return { driver: result.driver, token: result.token };
};

export const driverForgotPasswordApi = async (phone: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/driver/auth/forgot-password`, { method: 'POST', headers: publicHeaders(), body: JSON.stringify({ phone }) });
  await handleResponse(response);
};

export const driverResetPasswordApi = async (phone: string, code: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/driver/auth/reset-password`, { method: 'POST', headers: publicHeaders(), body: JSON.stringify({ phone, code, newPassword }) });
  await handleResponse(response);
};

export const getDriverMeApi = async (): Promise<{ driver: DriverAuthUser }> => {
  const response = await fetch(`${API_BASE}/driver/auth/me`, { headers: authHeaders() });
  return handleResponse(response);
};

export const updateDriverMeApi = async (data: Record<string, unknown>): Promise<{ driver: DriverAuthUser }> => {
  const response = await fetch(`${API_BASE}/driver/auth/me`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse(response);
};

export const driverLogoutApi = async (): Promise<void> => {
  const response = await fetch(`${API_BASE}/driver/auth/logout`, { method: 'POST', headers: authHeaders() });
  await handleResponse(response);
};

export const getDriverTripsApi = async (): Promise<{ trips: TripData[] }> => {
  const response = await fetch(`${API_BASE}/driver/trips`, { headers: authHeaders() });
  return handleResponse(response);
};

export const getDriverTripByIdApi = async (id: string): Promise<{ trip: TripData; tickets: TicketData[]; driver: DriverData; vehicle: VehicleData }> => {
  const response = await fetch(`${API_BASE}/driver/trips/${id}`, { headers: authHeaders() });
  return handleResponse(response);
};

export const updateDriverStatusApi = async (status: 'available' | 'on_trip' | 'off_duty'): Promise<{ driver: DriverData }> => {
  const response = await fetch(`${API_BASE}/driver/status`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) });
  return handleResponse(response);
};

export const updateTripStatusApi = async (tripId: string, status: 'scheduled' | 'boarding' | 'in_transit' | 'completed' | 'cancelled'): Promise<{ trip: TripData }> => {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/status`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) });
  return handleResponse(response);
};

export const updateTripPositionApi = async (tripId: string, latitude: number, longitude: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/position`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ latitude, longitude }),
  });
  await handleResponse(response);
};

export const reportIncidentApi = async (data: { tripId: string; type: 'mechanical' | 'delay' | 'road' | 'passenger' | 'other'; description?: string; position?: string }): Promise<{ incident: Incident }> => {
  const response = await fetch(`${API_BASE}/driver/incidents`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse(response);
};

export const validateTicketApi = async (data: { ticketId?: string; backupCode?: string }): Promise<{ ticket: TicketData }> => {
  const response = await fetch(`${API_BASE}/driver/tickets/validate`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse(response);
};

export const lookupTicketApi = async (data: { ticketId?: string; backupCode?: string }): Promise<{ ticket: TicketData; trip: { id: string; depart: string; arrivee: string; time: string } }> => {
  const response = await fetch(`${API_BASE}/driver/tickets/lookup`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse(response);
};

export const notifyAbsentApi = async (tripId: string, message?: string): Promise<{ notified: { count: number; phones: string[] } }> => {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/notify-absent`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  return handleResponse(response);
};

export interface ChatMessage {
  id: string;
  tripId?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  sender: 'driver' | 'company';
  body: string;
  read: boolean;
  createdAt: string;
}

export const getDriverMessagesApi = async (): Promise<{ messages: ChatMessage[] }> => {
  const response = await fetch(`${API_BASE}/driver/messages`, { headers: authHeaders() });
  return handleResponse(response);
};

export const sendDriverMessageApi = async (data: { tripId?: string; body: string }): Promise<{ message: ChatMessage }> => {
  const response = await fetch(`${API_BASE}/driver/messages`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse(response);
};

export const getDriverStatsApi = async (): Promise<{ stats: DriverStats }> => {
  const response = await fetch(`${API_BASE}/driver/stats`, { headers: authHeaders() });
  return handleResponse(response);
};

export interface Incident {
  id: string;
  tripId: string;
  driverId: string;
  companyId: string;
  type: 'mechanical' | 'delay' | 'road' | 'passenger' | 'other';
  description?: string;
  position?: string;
  createdAt: string;
}

export interface DriverStats {
  tripsCompleted: number;
  passengersTransported: number;
  kilometersDriven: number;
  averageRating: number;
}
