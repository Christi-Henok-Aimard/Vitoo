export type PaymentMethod = string;

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';

export interface Trip {
  id: string;
  company: string;
  companyPhone: string;
  companyLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  depart: string;
  arrivee: string;
  time: string;
  duration: string;
  price: number; // FCFA
  availableSeats: number;
  station: string;
  driverName: string;
  driverRating: number;
  driverTrips: number;
  driverReview: string;
  vehiclePlate: string;
  paymentMethods: PaymentMethod[];
  stops: string[]; // itinéraire : arrêts intermédiaires
  latitude?: number;
  longitude?: number;
  lastPositionAt?: string;
}

export interface Booking {
  id: string;
  tripId: string;
  userId?: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seats: number;
  seatNumber?: string;
  amount?: number;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  createdAt: string;
}

export interface BookingWithTrip extends Booking {
  trip: Trip;
}
