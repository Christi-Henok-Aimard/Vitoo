import type { Trip } from './trip';

export type PaymentMethod = 'Orange Money' | 'Wave' | 'MTN MoMo' | 'Moov Money' | 'Espèces' | 'Carte Bdf';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface BookingRequest {
  tripId: string;
  passengerId?: string;
  seatNumber?: string;
  paymentMethod: PaymentMethod;
  amount?: number;
  passengerName?: string;
  passengerPhone?: string;
}

export interface BookingTicket {
  id: string;
  code: string;
  status?: string;
  seatNumber?: string;
  passengerName?: string;
  passengerPhone?: string;
  paymentMethod?: string;
  amount?: number;
  soldBy?: string;
  commissionRate?: number;
  commissionAmount?: number;
  companyNet?: number;
  createdAt?: string;
}

export interface Booking {
  id: string;
  trip: Trip;
  passengerName?: string;
  passengerPhone?: string;
  seatNumber: string;
  paymentMethod?: PaymentMethod;
  amount?: number;
  qrCodeUrl?: string;
  status: BookingStatus;
  createdAt: string;
  ticket?: BookingTicket;
}
