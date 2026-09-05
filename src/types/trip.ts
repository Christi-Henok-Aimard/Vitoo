export interface Trip {
  id: string;
  company: string;
  companyPhone?: string;
  companyLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  depart: string;
  arrivee: string;
  time: string;
  duration?: string;
  price: number; // FCFA
  priceLabel?: string; // ex : "5 000 FCFA" (calculé depuis price)
  availableSeats: number;
  station: string;
  driverName?: string;
  driverRating?: number;
  driverTrips?: number;
  driverReview?: string;
  vehiclePlate?: string;
  stops?: string[]; // itinéraire détaillé
  paymentMethods?: import('./booking').PaymentMethod[];
  latitude?: number; // dernière position GPS du car (chauffeur)
  longitude?: number;
  lastPositionAt?: string; // timestamp ISO de la dernière position
}

export interface TripSearchParams {
  depart?: string;
  arrivee?: string;
  date?: string;
  company?: string;
}
