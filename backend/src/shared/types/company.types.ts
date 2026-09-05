export interface Driver {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  status: 'available' | 'on_trip' | 'off_duty';
  provider?: 'password' | 'google';
  passwordHash?: string;
  createdAt: string;
}

export interface Vehicle {
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

export type TicketSaleChannel = 'online' | 'counter';

export interface Ticket {
  id: string;
  tripId: string;
  companyId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  amount: number;
  paymentMethod: string;
  soldBy: TicketSaleChannel;
  commissionRate: number;
  commissionAmount: number;
  companyNet: number;
  status: 'valid' | 'used' | 'cancelled';
  createdAt: string;
}

export interface CompanyTrip {
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
  createdAt: string;
  company?: string;
  vehicle?: {
    id: string;
    plate: string;
    model: string;
    brand?: string;
    color?: string;
    capacity: number;
  } | null;
}

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
