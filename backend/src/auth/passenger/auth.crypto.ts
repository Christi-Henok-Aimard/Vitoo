import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { signJwt, verifyJwt, type JwtPayload } from '../../shared/middleware/jwt.js';

const scrypt = promisify(scryptCallback);

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
};

export const verifyPassword = async (password: string, storedHash?: string) => {
  if (!storedHash) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  const storedKey = Buffer.from(key, 'hex');
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
};

/** Normalise paymentMethods (JSON string, chaîne CSV héritée ou tableau) vers un tableau. */
export const parsePaymentMethods = (value: string | string[] | undefined): string[] | undefined => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.filter((m): m is string => typeof m === 'string');
  try {
    const parsed = JSON.parse(value || '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter((m): m is string => typeof m === 'string') : [];
  } catch {
    return value.split(',').map((m) => m.trim()).filter(Boolean);
  }
};

export const createToken = (user: {
  id: string;
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
}): string => {
  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
    phone: user.phone,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    city: user.city,
    provider: user.provider,
    googleId: user.googleId,
    avatarUrl: user.avatarUrl,
    companyName: user.companyName,
    rccm: user.rccm,
    taxId: user.taxId,
    companyLogo: user.companyLogo,
    primaryColor: user.primaryColor,
    secondaryColor: user.secondaryColor,
    paymentMethods: parsePaymentMethods(user.paymentMethods as string | string[] | undefined),
    companyId: user.companyId,
  };
  return signJwt(payload);
};

export const verifyToken = (token: string): JwtPayload | undefined => verifyJwt(token);
