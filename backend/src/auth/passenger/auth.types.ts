export type UserRole = 'passenger' | 'driver' | 'company' | 'admin';

export type AuthProvider = 'password' | 'google';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  city: string;
  role: UserRole;
  /** Hash du mot de passe. Absent pour les comptes créés via Google. */
  passwordHash?: string;
  /** Identifiant unique renvoyé par Google (sub). */
  googleId?: string;
  /** Méthode d'inscription du compte. */
  provider: AuthProvider;
  /** URL de l'avatar Google, si fournie. */
  avatarUrl?: string;
  createdAt: string;
  /** Champs spécifiques aux compagnies */
  companyName?: string;
  rccm?: string;
  taxId?: string;
  companyLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  paymentMethods?: string[];
}

export type PublicUser = Omit<AuthUser, 'passwordHash'>;

export interface RegisterInput {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  password: string;
  /** Champ facultatif côté inscription (validation légère si présent). */
  email?: string;
}

export interface GoogleLoginInput {
  idToken: string;
}

export interface ResetPasswordInput {
  phone?: string;
  email?: string;
  code: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  city?: string;
  phone?: string;
}
