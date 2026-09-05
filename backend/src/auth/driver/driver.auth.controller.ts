import type { Request, Response } from 'express';
import {
  registerDriver,
  loginDriver,
  forgotPasswordDriver,
  resetPasswordDriver,
  getDriverSession,
  deleteDriverSession,
  toPublicDriver,
} from './driver.auth.service.js';
import type { DriverAuthUser } from './driver.auth.service.js';
import {
  validateDriverRegisterInput,
  validateDriverLoginInput,
  validateDriverForgotPasswordInput,
  validateDriverResetPasswordInput,
} from './driver.auth.validation.js';

export const registerDriverController = async (request: Request, response: Response) => {
  const error = validateDriverRegisterInput(request.body);
  if (error) return response.status(400).json({ message: error });
  try {
    const result = await registerDriver(request.body);
    return response.status(201).json({ driver: toPublicDriver(result.driver), token: result.token });
  } catch (cause) {
    return response.status(409).json({ message: cause instanceof Error ? cause.message : 'Inscription impossible.' });
  }
};

export const loginDriverController = async (request: Request, response: Response) => {
  const { phone, password } = request.body as { phone?: string; password?: string };
  const error = validateDriverLoginInput({ phone: phone || '', password: password || '' });
  if (error) return response.status(400).json({ message: error });
  try {
    const result = await loginDriver(phone || '', password || '');
    return response.json({ driver: toPublicDriver(result.driver), token: result.token });
  } catch {
    return response.status(401).json({ message: 'Numéro ou mot de passe incorrect.' });
  }
};

export const forgotPasswordDriverController = async (request: Request, response: Response) => {
  const { phone } = request.body as { phone?: string };
  const error = validateDriverForgotPasswordInput({ phone: phone || '' });
  if (error) return response.status(400).json({ message: error });
  await forgotPasswordDriver(phone || '');
  return response.json({ message: 'Si ce numéro existe, un code de vérification a été envoyé.' });
};

export const resetPasswordDriverController = async (request: Request, response: Response) => {
  const error = validateDriverResetPasswordInput(request.body);
  if (error) return response.status(400).json({ message: error });
  try {
    const { phone, code, newPassword } = request.body;
    const driver = await resetPasswordDriver(phone || '', code, newPassword);
    const driverAuthUser: DriverAuthUser = {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
      email: driver.email,
      role: 'driver',
      companyId: driver.companyId,
      provider: driver.provider,
    };
    return response.json({ message: 'Mot de passe réinitialisé avec succès.', driver: toPublicDriver(driverAuthUser) });
  } catch (cause) {
    return response.status(400).json({
      message: cause instanceof Error ? cause.message : 'Réinitialisation impossible.',
    });
  }
};

export const meDriverController = async (request: Request, response: Response) => {
  const token = request.headers.authorization?.replace('Bearer ', '') || '';
  const driver = await getDriverSession(token);
  return response.json({ driver: driver ? toPublicDriver(driver) : undefined });
};

export const updateMeDriverController = async (request: Request, response: Response) => {
  const token = request.headers.authorization?.replace('Bearer ', '') || '';
  const driver = token ? await getDriverSession(token) : undefined;
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });
  return response.json({ driver: toPublicDriver(driver) });
};

export const logoutDriverController = (request: Request, response: Response) => {
  const token = request.headers.authorization?.replace('Bearer ', '') || '';
  if (token) deleteDriverSession(token);
  return response.json({ message: 'Déconnexion réussie.' });
};
