import type {
  RegisterInput,
  GoogleLoginInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from "./auth.types.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasValue = (value: unknown): boolean =>
  typeof value === "string" && value.trim().length > 0;

const isValidPhone = (value: string): boolean =>
  value.replace(/\D/g, "").length >= 8;

export const validateRegisterInput = (
  input: Partial<RegisterInput>,
): string | null => {
  const requiredFields: Array<keyof RegisterInput> = [
    "firstName",
    "lastName",
    "phone",
    "city",
    "password",
  ];
  const missing = requiredFields.filter((field) => !hasValue(input[field]));
  if (missing.length)
    return `Champs obligatoires manquants : ${missing.join(", ")}`;

  if (!isValidPhone(String(input.phone)))
    return "Le numéro de téléphone est invalide (8 chiffres minimum).";
  if (String(input.password).length < 8)
    return "Le mot de passe doit contenir au moins 8 caractères.";
  if (input.email && !EMAIL_REGEX.test(String(input.email).trim()))
    return "L'adresse email n'est pas valide.";
  return null;
};

export const validateLoginInput = (input: {
  phone?: string;
  password?: string;
}): string | null => {
  if (!hasValue(input.phone)) return "Le numéro de téléphone est obligatoire.";
  if (!hasValue(input.password)) return "Le mot de passe est obligatoire.";
  return null;
};

export const validateGoogleLoginInput = (
  input: Partial<GoogleLoginInput>,
): string | null => {
  if (!hasValue(input.idToken)) return "Le token Google est obligatoire.";
  return null;
};

export const validateForgotPasswordInput = (input: {
  phone?: string;
  email?: string;
}): string | null => {
  const hasPhone = hasValue(input.phone);
  const hasEmail = hasValue(input.email);
  if (!hasPhone && !hasEmail) return 'Le numéro de téléphone ou l\'email est obligatoire.';
  if (hasPhone && !isValidPhone(String(input.phone))) return 'Le numéro de téléphone est invalide (8 chiffres minimum).';
  if (hasEmail && !EMAIL_REGEX.test(String(input.email).trim())) return 'L\'adresse email n\'est pas valide.';
  return null;
};

export const validateResetPasswordInput = (
  input: Partial<ResetPasswordInput>,
): string | null => {
  const hasPhone = hasValue(input.phone);
  const hasEmail = hasValue(input.email);
  if (!hasPhone && !hasEmail) return 'Le numéro de téléphone ou l\'email est obligatoire.';
  if (!hasValue(input.code)) return 'Le code de vérification est obligatoire.';
  if (!hasValue(input.newPassword))
    return 'Le nouveau mot de passe est obligatoire.';
  if (String(input.newPassword).length < 8)
    return 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
  return null;
};

export const validateUpdateProfileInput = (
  input: Partial<UpdateProfileInput>,
): string | null => {
  if (input.email && !EMAIL_REGEX.test(String(input.email).trim()))
    return "L'adresse email n'est pas valide.";
  if (input.phone && !isValidPhone(String(input.phone)))
    return "Le numéro de téléphone est invalide.";
  return null;
};
