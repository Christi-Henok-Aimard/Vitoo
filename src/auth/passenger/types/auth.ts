export type AuthScreen = 
  | 'register' 
  | 'login' 
  | 'forgot_phone' 
  | 'forgot_otp' 
  | 'reset_password';

export type UserRole = 'passenger' | 'driver' | 'company' | 'admin';

export interface DriverSpaceInfo {
  id: string;
  companyId: string;
  companyName: string;
  licenseNumber?: string;
  status: 'available' | 'on_trip' | 'off_duty';
}

export interface UserSession {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  city: string;
  role: UserRole;
  token?: string;
  provider?: 'password' | 'google';
  avatarUrl?: string;
  companyName?: string;
  rccm?: string;
  taxId?: string;
  companyLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  paymentMethods?: string[];
  driverSpace?: DriverSpaceInfo | null;
}
