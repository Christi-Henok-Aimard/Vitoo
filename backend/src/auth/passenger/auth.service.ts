import { randomInt } from 'node:crypto';
import { prisma } from '../../lib/db.js';
import { createToken, hashPassword, verifyPassword, verifyToken, parsePaymentMethods } from './auth.crypto.js';
import { verifyGoogleIdToken } from './auth.google.js';
import { sendSms } from '../../notifications/sms.js';
import { sendEmail } from '../../notifications/email.js';
import { normalizePhone } from './auth.phone.js';
import type { AuthUser, PublicUser, RegisterInput, GoogleLoginInput } from './auth.types.js';

export const toPublicUser = (user: AuthUser): PublicUser => {
  const { passwordHash: _ignored, ...rest } = user;
  void _ignored;
  return { ...rest, paymentMethods: parsePaymentMethods(rest.paymentMethods as string | string[] | undefined) };
};

export interface DriverSpaceInfo {
  id: string;
  companyId: string;
  companyName: string;
  licenseNumber?: string;
  status: 'available' | 'on_trip' | 'off_duty';
}

export const getDriverSpace = async (userId: string): Promise<DriverSpaceInfo | null> => {
  const driver = await prisma.driver.findFirst({
    where: { userId },
    include: { company: { select: { companyName: true, lastName: true } } },
  });
  if (!driver) return null;
  return {
    id: driver.id,
    companyId: driver.companyId,
    companyName: driver.company.companyName || driver.company.lastName || 'Compagnie',
    licenseNumber: driver.licenseNumber || undefined,
    status: driver.status,
  };
};

const withDriverSpace = async (result: { user: PublicUser; token: string }) => {
  const space = await getDriverSpace(result.user.id);
  return { ...result, user: { ...result.user, driverSpace: space } };
};

export const toPublicUserWithDriverSpace = async (user: AuthUser): Promise<PublicUser & { driverSpace: DriverSpaceInfo | null }> => {
  const space = await getDriverSpace(user.id);
  return { ...toPublicUser(user), driverSpace: space };
};

const mapUser = (user: {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  city: string | null;
  role: string;
  provider: string;
  googleId: string | null;
  avatarUrl: string | null;
  passwordHash: string | null;
  companyName: string | null;
  rccm: string | null;
  taxId: string | null;
  companyLogo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  paymentMethods: string;
  createdAt: Date;
}): AuthUser => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  email: user.email || undefined,
  city: user.city || '',
  role: user.role as AuthUser['role'],
  provider: user.provider as AuthUser['provider'],
  googleId: user.googleId || undefined,
  avatarUrl: user.avatarUrl || undefined,
  passwordHash: user.passwordHash || undefined,
  companyName: user.companyName || undefined,
  rccm: user.rccm || undefined,
  taxId: user.taxId || undefined,
  companyLogo: user.companyLogo || undefined,
  primaryColor: user.primaryColor || undefined,
  secondaryColor: user.secondaryColor || undefined,
  paymentMethods: parsePaymentMethods(user.paymentMethods) ?? [],
  createdAt: user.createdAt.toISOString(),
});

export const listUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      city: true,
      role: true,
      provider: true,
      googleId: true,
      avatarUrl: true,
      companyName: true,
      rccm: true,
      taxId: true,
      paymentMethods: true,
      createdAt: true,
    },
  });
  return users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email || undefined,
    city: user.city || '',
    role: user.role as AuthUser['role'],
    provider: user.provider as AuthUser['provider'],
    googleId: user.googleId || undefined,
    avatarUrl: user.avatarUrl || undefined,
    companyName: user.companyName || undefined,
    rccm: user.rccm || undefined,
    taxId: user.taxId || undefined,
    paymentMethods: parsePaymentMethods(user.paymentMethods as string | string[] | undefined),
    createdAt: user.createdAt.toISOString(),
  })) as PublicUser[];
};

export const register = async (input: RegisterInput) => {
  const normalizedPhone = normalizePhone(input.phone);
  const existing = await prisma.user.findFirst({
    where: { phone: normalizedPhone },
  });
  if (existing && (existing.passwordHash || existing.role !== 'passenger')) {
    throw new Error('Ce numéro est déjà associé à un compte.');
  }

  const passwordHash = await hashPassword(input.password);

  let user;
  if (existing) {
    // Compte créé par une compagnie (ajout chauffeur) sans mot de passe → activation à la première connexion
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: normalizedPhone,
        email: input.email?.trim() || null,
        city: input.city.trim(),
        passwordHash,
        provider: 'password',
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: normalizedPhone,
        email: input.email?.trim() || null,
        city: input.city.trim(),
        role: 'passenger',
        provider: 'password',
        passwordHash,
      },
    });
  }

  const token = createToken(mapUser(user));
  return withDriverSpace({ user: toPublicUser(mapUser(user)), token });
};

export const login = async (phone: string, password: string) => {
  const normalizedPhone = normalizePhone(phone);
  const user = await prisma.user.findFirst({
    where: { phone: normalizedPhone },
  });
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    throw new Error('Numéro ou mot de passe incorrect.');
  }
  const token = createToken(mapUser(user));
  return withDriverSpace({ user: toPublicUser(mapUser(user)), token });
};

export const googleLogin = async (input: GoogleLoginInput) => {
  const profile = await verifyGoogleIdToken(input.idToken);

  let user = await prisma.user.findFirst({
    where: { googleId: profile.googleId },
  });

  if (!user && profile.email) {
    user = await prisma.user.findFirst({
      where: { email: profile.email },
    });
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        firstName: profile.firstName || profile.fullName || 'Utilisateur',
        lastName: profile.lastName || '',
        phone: '',
        email: profile.email,
        city: 'Abidjan',
        role: 'passenger',
        provider: 'google',
        googleId: profile.googleId,
        avatarUrl: profile.picture,
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.googleId,
        provider: 'google',
        avatarUrl: profile.picture || user.avatarUrl,
      },
    });
  }

  const token = createToken(mapUser(user));
  return withDriverSpace({ user: toPublicUser(mapUser(user)), token });
};

export const getUserByToken = (token: string) => {
  const payload = verifyToken(token);
  if (!payload) return undefined;
  return {
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
  } as AuthUser;
};

export const getUserFromTokenPayload = (token: string): AuthUser | undefined => {
  const payload = verifyToken(token);
  if (!payload) return undefined;
  return {
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
};

export const updateUser = async (userId: string, changes: Partial<Pick<AuthUser, 'firstName' | 'lastName' | 'email' | 'city' | 'phone'>>) => {
  const allowedFields = ['firstName', 'lastName', 'email', 'city', 'phone'] as const;
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in changes && changes[field] !== undefined) {
      updateData[field] = changes[field];
    }
  }

  if (typeof updateData.phone === 'string') updateData.phone = normalizePhone(updateData.phone);
  if (typeof updateData.email === 'string') updateData.email = updateData.email.trim().toLowerCase();

  if (updateData.phone || updateData.email) {
    const conflicted = await prisma.user.findFirst({
      where: {
        NOT: { id: userId },
        OR: [
          ...(updateData.phone ? [{ phone: updateData.phone as string }] : []),
          ...(updateData.email ? [{ email: updateData.email as string }] : []),
        ],
      },
    });
    if (conflicted) {
      if (updateData.phone && conflicted.phone === updateData.phone) {
        throw new Error('Ce numéro de téléphone est déjà utilisé par un autre compte.');
      }
      throw new Error('Cette adresse email est déjà utilisée par un autre compte.');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return toPublicUser(mapUser(user));
};

export const updatePassword = async (userId: string, currentPassword: string | undefined, newPassword: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error('Utilisateur introuvable.');

  if (user.passwordHash && currentPassword) {
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) throw new Error('Mot de passe actuel incorrect.');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, provider: 'password' },
  });

  return true;
};

const MAX_RESET_ATTEMPTS = 5;
const resetCodes = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const purgeExpiredResetCodes = () => {
  const now = Date.now();
  for (const [key, entry] of resetCodes) {
    if (entry.expiresAt < now) resetCodes.delete(key);
  }
};

export const forgotPassword = async (input: { phone?: string; email?: string }) => {
  purgeExpiredResetCodes();
  const phone = input.phone?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!phone && !email) return;

  let user: AuthUser | null;
  let resetKey: string;

  if (phone) {
    const normalized = normalizePhone(phone);
    const found = await prisma.user.findFirst({ where: { phone: normalized } });
    user = found ? mapUser(found) : null;
    resetKey = normalized;
  } else if (email) {
    const found = await prisma.user.findFirst({ where: { email } });
    user = found ? mapUser(found) : null;
    resetKey = email;
  } else {
    return;
  }

  process.stdout.write(`[Vitoo][Forgot] Demande pour phone="${phone}" email="${email}" → user trouvé ? ${Boolean(user)}\n`);
  if (!user) return;

  const code = String(randomInt(100000, 1000000));
  resetCodes.set(resetKey, { code, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });

  if (phone && user.phone) {
    await sendSms(user.phone || resetKey, `Vitoo : votre code de vérification est ${code}. Il expire dans 5 minutes.`);
  }

  if (email && user.email) {
    const subject = 'Vitoo : réinitialisation de mot de passe';
    const html = `
      <div style="font-family: Inter, Trebuchet MS, Segoe UI, sans-serif; max-width: 480px; margin: auto; padding: 2rem; color: #10233f;">
        <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Vitoo</h1>
        <p style="color: #77869c; margin-bottom: 1.5rem;">Réinitialisation de mot de passe</p>
        <p style="font-size: 1rem; line-height: 1.6;">Bonjour <strong>${user.firstName}</strong>,</p>
        <p style="font-size: 1rem; line-height: 1.6;">Votre code de vérification est :</p>
        <p style="font-size: 2rem; font-weight: 900; letter-spacing: 0.2em; color: #1d5df5; padding: 1rem; background: #eef3ff; border-radius: 12px; text-align: center;">${code}</p>
        <p style="color: #77869c; font-size: 0.85rem;">Ce code expire dans 5 minutes. Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
        <p style="color: #8290a5; font-size: 0.75rem; margin-top: 2rem;">— L'équipe Vitoo</p>
      </div>
    `;
    await sendEmail({ to: user.email, subject, html });
  }
};

export const resetPassword = async (input: { phone?: string; email?: string; code: string; newPassword: string }) => {
  purgeExpiredResetCodes();
  const phone = input.phone?.trim();
  const email = input.email?.trim().toLowerCase();

  let resetKey: string | undefined;

  if (phone) {
    resetKey = normalizePhone(phone);
  } else if (email) {
    resetKey = email;
  }

  if (!resetKey) throw new Error('Numéro de téléphone ou email obligatoire.');

  const entry = resetCodes.get(resetKey);
  if (!entry || entry.expiresAt < Date.now()) {
    throw new Error('Code de vérification invalide ou expiré.');
  }
  entry.attempts += 1;
  if (entry.attempts > MAX_RESET_ATTEMPTS) {
    resetCodes.delete(resetKey);
    throw new Error('Trop de tentatives. Demandez un nouveau code.');
  }
  if (entry.code !== input.code) {
    throw new Error('Code de vérification invalide ou expiré.');
  }

  const user = phone
    ? await prisma.user.findFirst({ where: { phone: resetKey } })
    : await prisma.user.findFirst({ where: { email: resetKey } });

  if (!user) throw new Error('Utilisateur introuvable.');

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, provider: 'password' },
  });

  resetCodes.delete(resetKey);
  return toPublicUser(mapUser(user));
};
