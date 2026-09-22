import type { Request, Response } from 'express';
import type { AuthUser } from '../passenger/auth.types.js';
import { prisma } from '../../lib/db.js';
import {
  registerCompany,
  loginCompany,
  googleLoginCompany,
  forgotPasswordCompany,
  resetPasswordCompany,
  toPublicCompany,
  updateCompanyProfile,
} from './company.auth.service.js';
import {
  validateCompanyRegisterInput,
  validateCompanyLoginInput,
  validateCompanyForgotPasswordInput,
  validateCompanyResetPasswordInput,
} from './company.auth.validation.js';

export const registerCompanyController = async (request: Request, response: Response) => {
  const error = validateCompanyRegisterInput(request.body);
  if (error) return response.status(400).json({ message: error });
  try {
    return response.status(201).json(await registerCompany(request.body));
  } catch (cause) {
    return response.status(409).json({
      message: cause instanceof Error ? cause.message : 'Inscription compagnie impossible.',
    });
  }
};

export const loginCompanyController = async (request: Request, response: Response) => {
  const { email, password } = request.body as { email?: string; password?: string };
  const error = validateCompanyLoginInput({ email, password });
  if (error) return response.status(400).json({ message: error });
  try {
    return response.json(await loginCompany({ email: email!, password: password! }));
  } catch (cause) {
    return response.status(401).json({
      message: cause instanceof Error ? cause.message : 'Connexion impossible.',
    });
  }
};

export const googleLoginCompanyController = async (request: Request, response: Response) => {
  const { idToken } = request.body as { idToken?: string };
  if (!idToken) return response.status(400).json({ message: 'Le token Google est obligatoire.' });
  try {
    return response.json(await googleLoginCompany(idToken));
  } catch (cause) {
    return response.status(401).json({
      message: cause instanceof Error ? cause.message : 'Connexion Google impossible.',
    });
  }
};

export const forgotPasswordCompanyController = async (request: Request, response: Response) => {
  const { email, phone } = request.body as { email?: string; phone?: string };
  const error = validateCompanyForgotPasswordInput({ email, phone });
  if (error) return response.status(400).json({ message: error });
  await forgotPasswordCompany({ email, phone });
  return response.json({ message: 'Si cet email/numéro existe, un code de vérification a été envoyé.' });
};

export const resetPasswordCompanyController = async (request: Request, response: Response) => {
  const error = validateCompanyResetPasswordInput(request.body);
  if (error) return response.status(400).json({ message: error });
  try {
    const { email, phone, code, newPassword } = request.body;
    const user = await resetPasswordCompany({ email, phone, code, newPassword });
    return response.json({ message: 'Mot de passe réinitialisé avec succès.', user });
  } catch (cause) {
    return response.status(400).json({
      message: cause instanceof Error ? cause.message : 'Réinitialisation impossible.',
    });
  }
};

export const meCompanyController = async (request: Request, response: Response) => {
  if (!request.authUser) return response.status(401).json({ message: 'Non authentifié.' });
  const user = await prisma.user.findUnique({ where: { id: request.authUser.id } });
  if (!user) return response.status(404).json({ message: 'Compagnie introuvable.' });
  return response.json({ user: toPublicCompany(user as unknown as AuthUser) });
};

export const updateMeCompanyController = async (request: Request, response: Response) => {
  if (!request.authUser || request.authUser.role !== 'company') return response.status(403).json({ message: 'Accès réservé aux compagnies.' });
  const body = request.body as Record<string, unknown>;
  const changes = {
    companyName: typeof body.companyName === 'string' ? body.companyName.trim() : undefined,
    city: typeof body.city === 'string' ? body.city.trim() : undefined,
    phone: typeof body.phone === 'string' ? body.phone.trim() : undefined,
    rccm: typeof body.rccm === 'string' ? body.rccm.trim() : undefined,
    taxId: typeof body.taxId === 'string' ? body.taxId.trim() : undefined,
    companyLogo: typeof body.companyLogo === 'string' ? body.companyLogo : undefined,
    primaryColor: typeof body.primaryColor === 'string' ? body.primaryColor : undefined,
    secondaryColor: typeof body.secondaryColor === 'string' ? body.secondaryColor : undefined,
    paymentMethods: Array.isArray(body.paymentMethods) ? body.paymentMethods.filter((value): value is string => typeof value === 'string') : undefined,
  };
  try {
    const user = await updateCompanyProfile(request.authUser.id, changes);
    return response.json({ user });
  } catch (cause) {
    return response.status(409).json({
      message: cause instanceof Error ? cause.message : 'Mise à jour du profil impossible.',
    });
  }
};
