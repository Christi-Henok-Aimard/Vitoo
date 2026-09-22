import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import {
  listUsers,
  login,
  register,
  updateUser,
  updatePassword,
  googleLogin,
  forgotPassword,
  resetPassword,
  toPublicUser,
  getDriverSpace,
} from "./auth.service.js";
import {
  validateRegisterInput,
  validateLoginInput,
  validateGoogleLoginInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
  validateUpdateProfileInput,
} from "./auth.validation.js";

export const registerController = async (
  request: Request,
  response: Response,
) => {
  const error = validateRegisterInput(request.body);
  if (error) return response.status(400).json({ message: error });
  try {
    return response.status(201).json(await register(request.body));
  } catch (cause) {
    return response
      .status(409)
      .json({
        message:
          cause instanceof Error ? cause.message : "Inscription impossible.",
      });
  }
};

export const loginController = async (request: Request, response: Response) => {
  const { phone, password } = request.body as {
    phone?: string;
    password?: string;
  };
  const error = validateLoginInput({ phone, password });
  if (error) return response.status(400).json({ message: error });
  try {
    return response.json(await login(phone!, password!));
  } catch (cause) {
    return response
      .status(401)
      .json({
        message:
          cause instanceof Error ? cause.message : "Connexion impossible.",
      });
  }
};

export const googleLoginController = async (
  request: Request,
  response: Response,
) => {
  const error = validateGoogleLoginInput(request.body);
  if (error) return response.status(400).json({ message: error });
  try {
    return response.json(await googleLogin({ idToken: request.body.idToken }));
  } catch (cause) {
    return response
      .status(401)
      .json({
        message:
          cause instanceof Error
            ? cause.message
            : "Connexion Google impossible.",
      });
  }
};

export const meController = async (request: Request, response: Response) => {
  if (!request.authUser) return response.json({ user: undefined });
  const driverSpace = await getDriverSpace(request.authUser.id);
  return response.json({ user: { ...toPublicUser(request.authUser), driverSpace } });
};

export const meMessagesController = async (request: Request, response: Response) => {
  if (!request.authUser) return response.status(401).json({ message: 'Non authentifié.' });

  const messages = await prisma.message.findMany({
    where: { driver: { userId: request.authUser.id } },
    include: { company: { select: { companyName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return response.json({
    messages: messages.map((m) => ({
      id: m.id,
      companyId: m.companyId,
      companyName: m.company.companyName || m.company.lastName || 'Vitoo',
      tripId: m.tripId,
      sender: m.sender,
      body: m.body,
      read: m.read,
      createdAt: m.createdAt.toISOString(),
    })),
  });
};

export const updateMeController = async (
  request: Request,
  response: Response,
) => {
  const error = validateUpdateProfileInput(request.body);
  if (error) return response.status(400).json({ message: error });
  try {
    return response.json({
      user: await updateUser(request.authUser!.id, request.body),
    });
  } catch (cause) {
    return response.status(409).json({
      message: cause instanceof Error ? cause.message : 'Mise à jour du profil impossible.',
    });
  }
};

export const updatePasswordController = async (
  request: Request,
  response: Response,
) => {
  const { currentPassword, newPassword } = request.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!newPassword) {
    return response.status(400).json({ message: 'Nouveau mot de passe obligatoire.' });
  }

  if (newPassword.length < 8) {
    return response.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
  }

  try {
    await updatePassword(request.authUser!.id, currentPassword, newPassword);
    return response.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (cause) {
    return response.status(400).json({
      message: cause instanceof Error ? cause.message : 'Mise à jour impossible.',
    });
  }
};

export const forgotPasswordController = async (
  request: Request,
  response: Response,
) => {
  const { phone, email } = request.body as { phone?: string; email?: string };
  const error = validateForgotPasswordInput({ phone, email });
  if (error) return response.status(400).json({ message: error });
  await forgotPassword({ phone, email });
  return response.json({
    message: "Si ce numéro/email existe, un code de vérification a été envoyé.",
  });
};

export const resetPasswordController = async (
  request: Request,
  response: Response,
) => {
  const error = validateResetPasswordInput(request.body);
  if (error) return response.status(400).json({ message: error });
  try {
    const { phone, email, code, newPassword } = request.body;
    const user = await resetPassword({ phone, email, code, newPassword });
    return response.json({
      message: "Mot de passe réinitialisé avec succès.",
      user,
    });
  } catch (cause) {
    return response
      .status(400)
      .json({
        message:
          cause instanceof Error
            ? cause.message
            : "Réinitialisation impossible.",
      });
  }
};

export const listUsersController = async (_request: Request, response: Response) =>
  response.json({ users: await listUsers() });
