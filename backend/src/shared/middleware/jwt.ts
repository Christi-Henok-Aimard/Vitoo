import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vitoo-dev-secret-change-in-production';
const JWT_EXPIRY = '7d';

export interface JwtPayload {
  sub: string;
  role: 'passenger' | 'driver' | 'company' | 'admin';
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  city?: string;
  provider?: string;
  googleId?: string;
  avatarUrl?: string;
  companyName?: string;
  rccm?: string;
  taxId?: string;
  companyLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  paymentMethods?: string[];
  companyId?: string;
}

export const signJwt = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyJwt = (token: string): JwtPayload | undefined => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return undefined;
  }
};
