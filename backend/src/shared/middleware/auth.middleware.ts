import type { NextFunction, Request, Response } from 'express';
import { verifyToken, parsePaymentMethods } from '../../auth/passenger/auth.crypto.js';
import type { AuthUser } from '../../auth/passenger/auth.types.js';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: AuthUser;
  }
}

export const requireAuth = (request: Request, response: Response, next: NextFunction) => {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = token ? verifyToken(token) : undefined;
  if (!payload) return response.status(401).json({ message: 'Authentification requise.' });
  request.authUser = {
    id: payload.sub,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    email: payload.email,
    city: payload.city || '',
    role: payload.role,
    provider: (payload.provider as AuthUser['provider']) || 'password',
    googleId: payload.googleId,
    avatarUrl: payload.avatarUrl,
    companyName: payload.companyName,
    rccm: payload.rccm,
    taxId: payload.taxId,
    companyLogo: payload.companyLogo,
    primaryColor: payload.primaryColor,
    secondaryColor: payload.secondaryColor,
    paymentMethods: parsePaymentMethods(payload.paymentMethods as string | string[] | undefined),
    createdAt: new Date().toISOString(),
  };
  return next();
};

export const requireCompany = (request: Request, response: Response, next: NextFunction) => {
  if (request.authUser?.role !== 'company') return response.status(403).json({ message: 'Accès réservé aux compagnies.' });
  return next();
};
