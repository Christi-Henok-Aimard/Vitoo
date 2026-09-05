import type { DriverRegisterInput, DriverLoginInput, DriverForgotPasswordInput, DriverResetPasswordInput } from './driver.auth.types.js';

export const validateDriverRegisterInput = (input: DriverRegisterInput): string | null => {
  if (!input.firstName?.trim() || input.firstName.trim().length < 2) return 'Le prénom est obligatoire (2 caractères min).';
  if (!input.lastName?.trim() || input.lastName.trim().length < 2) return 'Le nom est obligatoire (2 caractères min).';
  if (!input.phone?.trim() || input.phone.trim().length < 8) return 'Le téléphone est obligatoire (8 caractères min).';
  if (!input.password || input.password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (!input.companyId?.trim()) return 'Identifiant compagnie manquant.';
  return null;
};

export const validateDriverLoginInput = (input: DriverLoginInput): string | null => {
  if (!input.phone?.trim()) return 'Le téléphone est obligatoire.';
  if (!input.password?.trim()) return 'Le mot de passe est obligatoire.';
  return null;
};

export const validateDriverForgotPasswordInput = (input: DriverForgotPasswordInput): string | null => {
  if (!input.phone?.trim()) return 'Le téléphone est obligatoire.';
  return null;
};

export const validateDriverResetPasswordInput = (input: DriverResetPasswordInput): string | null => {
  if (!input.phone?.trim()) return 'Le téléphone est obligatoire.';
  if (!input.code?.trim()) return 'Le code de vérification est obligatoire.';
  if (!input.newPassword || input.newPassword.length < 6) return 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
  return null;
};
