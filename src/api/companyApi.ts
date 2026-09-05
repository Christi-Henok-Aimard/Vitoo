import { COMPANY_SESSION_KEY, fireSessionExpired } from './sessionKeys';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const authHeaders = (): HeadersInit => {
  try {
    const raw = localStorage.getItem(COMPANY_SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) as { token?: string; email?: string; role?: string } : null;
    const token = parsed?.token || null;
    console.log('[CompanyAPI] Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN', 'Email:', parsed?.email, 'Role:', parsed?.role);
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  } catch {
    console.error('[CompanyAPI] Error reading token');
    return { 'Content-Type': 'application/json' };
  }
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) fireSessionExpired('company');
    const message = data.message || 'Une erreur est survenue.';
    throw new Error(message);
  }
  return data as T;
};

// Drivers
export interface DriverData {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber?: string;
  status: 'available' | 'on_trip' | 'off_duty';
}

export const getDriversApi = async (): Promise<{ drivers: DriverData[] }> => {
  const response = await fetch(`${API_BASE}/company/drivers`, { headers: authHeaders() });
  return handleResponse(response);
};

export const addDriverApi = async (data: { firstName: string; lastName: string; phone: string; licenseNumber?: string }): Promise<{ driver: DriverData }> => {
  const response = await fetch(`${API_BASE}/company/drivers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateDriverApi = async (id: string, data: Partial<DriverData>): Promise<{ driver: DriverData }> => {
  const response = await fetch(`${API_BASE}/company/drivers/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteDriverApi = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/company/drivers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleResponse(response);
};

// Vehicles
export interface VehicleData {
  id: string;
  companyId: string;
  plate: string;
  brand: string;
  model: string;
  capacity: number;
  color?: string;
  photo?: string;
  status: 'available' | 'in_transit' | 'maintenance';
}

export const getVehiclesApi = async (): Promise<{ vehicles: VehicleData[] }> => {
  const response = await fetch(`${API_BASE}/company/vehicles`, { headers: authHeaders() });
  return handleResponse(response);
};

export const addVehicleApi = async (data: { plate: string; brand: string; model: string; capacity: number; color?: string; photo?: string }): Promise<{ vehicle: VehicleData }> => {
  const response = await fetch(`${API_BASE}/company/vehicles`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateVehicleApi = async (id: string, data: Partial<VehicleData>): Promise<{ vehicle: VehicleData }> => {
  const response = await fetch(`${API_BASE}/company/vehicles/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteVehicleApi = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/company/vehicles/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleResponse(response);
};

// Trips
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
}

export const getTripsApi = async (): Promise<{ trips: TripData[] }> => {
  const response = await fetch(`${API_BASE}/company/trips`, { headers: authHeaders() });
  return handleResponse(response);
};

export const getTripByIdApi = async (id: string): Promise<{ trip: TripData; tickets: TicketData[]; driver: DriverData; vehicle: VehicleData }> => {
  const response = await fetch(`${API_BASE}/company/trips/${id}`, { headers: authHeaders() });
  return handleResponse(response);
};

export const addTripApi = async (data: {
  depart: string; arrivee: string; station: string; time: string; date: string;
  duration?: string; price: number; totalSeats: number; vehicleId: string; driverId: string;
  paymentMethods: string[]; stops?: string[];
}): Promise<{ trip: TripData }> => {
  const response = await fetch(`${API_BASE}/company/trips`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateTripApi = async (id: string, data: Partial<TripData>): Promise<{ trip: TripData }> => {
  const response = await fetch(`${API_BASE}/company/trips/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteTripApi = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/company/trips/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleResponse(response);
};

// Tickets
export interface TicketData {
  id: string;
  tripId: string;
  companyId: string;
  code?: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  amount: number;
  paymentMethod: string;
  soldBy: 'online' | 'counter';
  commissionRate: number;
  commissionAmount: number;
  companyNet: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  createdAt: string;
}

export const getTicketsApi = async (): Promise<{ tickets: TicketData[] }> => {
  const response = await fetch(`${API_BASE}/company/tickets`, { headers: authHeaders() });
  return handleResponse(response);
};

export const sellTicketApi = async (data: {
  tripId: string; passengerName: string; passengerPhone: string;
  seatNumber?: string; paymentMethod: string; soldBy?: 'online' | 'counter';
}): Promise<{ ticket: TicketData }> => {
  const response = await fetch(`${API_BASE}/company/tickets`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// Stats
export interface CompanyStats {
  totalSales: number;
  totalCommission: number;
  totalNet: number;
  totalTickets: number;
  onlineTickets: number;
  counterTickets: number;
  activeTrips: number;
  completedTrips: number;
}

export const getStatsApi = async (): Promise<{ stats: CompanyStats }> => {
  const response = await fetch(`${API_BASE}/company/stats`, { headers: authHeaders() });
  return handleResponse(response);
};
