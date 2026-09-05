import type { DriverAuthUser } from './driver.auth.service.js';

export interface DriverRegisterInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  companyId: string;
  licenseNumber?: string;
}

export interface DriverLoginInput {
  phone: string;
  password: string;
}

export interface DriverForgotPasswordInput {
  phone: string;
}

export interface DriverResetPasswordInput {
  phone: string;
  code: string;
  newPassword: string;
}

export interface DriverGoogleLoginInput {
  idToken: string;
}

export type PublicDriver = Omit<DriverAuthUser, 'provider'>;
