import type { CompanyRegisterInput, CompanyResetPasswordInput } from './company.auth.types.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasValue = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const isValidPhone = (value: string): boolean =>
  value.replace(/\D/g, '').length >= 8;

export const validateCompanyRegisterInput = (
  input: Partial<CompanyRegisterInput>,
): string | null => {
  const requiredFields: Array<keyof CompanyRegisterInput> = [
    'companyName',
    'rccm',
    'taxId',
    'city',
    'contactName',
    'phone',
    'email',
    'password',
  ];
  const missing = requiredFields.filter((field) => !hasValue(input[field]));
  if (missing.length)
    return `Champs obligatoires manquants : ${missing.join(', ')}`;

  if (!isValidPhone(String(input.phone)))
    return 'Le numéro de téléphone est invalide (8 chiffres minimum).';
  if (!EMAIL_REGEX.test(String(input.email).trim()))
    return "L'adresse email n'est pas valide.";
  if (String(input.password).length < 8)
    return 'Le mot de passe doit contenir au moins 8 caractères.';
  return null;
};

export const validateCompanyLoginInput = (input: {
  email?: string;
  password?: string;
}): string | null => {
  if (!hasValue(input.email)) return "L'email est obligatoire.";
  if (!EMAIL_REGEX.test(String(input.email).trim()))
    return "L'adresse email n'est pas valide.";
  if (!hasValue(input.password)) return 'Le mot de passe est obligatoire.';
  return null;
};

export const validateCompanyForgotPasswordInput = (input: {
  email?: string;
  phone?: string;
}): string | null => {
  const hasEmail = hasValue(input.email);
  const hasPhone = hasValue(input.phone);
  if (!hasEmail && !hasPhone) return "L'email ou le numéro de téléphone est obligatoire.";
  if (hasEmail && !EMAIL_REGEX.test(String(input.email).trim()))
    return "L'adresse email n'est pas valide.";
  if (hasPhone && !isValidPhone(String(input.phone)))
    return 'Le numéro de téléphone est invalide (8 chiffres minimum).';
  return null;
};

export const validateCompanyResetPasswordInput = (
  input: Partial<CompanyResetPasswordInput>,
): string | null => {
  const hasEmail = hasValue(input.email);
  const hasPhone = hasValue(input.phone);
  if (!hasEmail && !hasPhone) return "L'email ou le numéro de téléphone est obligatoire.";
  if (!hasValue(input.code)) return 'Le code de vérification est obligatoire.';
  if (!hasValue(input.newPassword))
    return 'Le nouveau mot de passe est obligatoire.';
  if (String(input.newPassword).length < 8)
    return 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
  return null;
};
