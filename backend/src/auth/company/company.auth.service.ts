import { prisma } from '../../lib/db.js';
import { createToken, hashPassword, verifyPassword, parsePaymentMethods } from '../passenger/auth.crypto.js';
import { sendSms } from '../../notifications/sms.js';
import { sendEmail } from '../../notifications/email.js';
import { normalizePhone } from '../passenger/auth.phone.js';
import { verifyGoogleIdToken } from '../passenger/auth.google.js';
import type { AuthUser, PublicUser } from '../passenger/auth.types.js';
import type { CompanyRegisterInput, CompanyLoginInput } from './company.auth.types.js';

export const toPublicCompany = (user: AuthUser): PublicUser => {
  const { passwordHash: _ignored, ...rest } = user;
  void _ignored;
  return { ...rest, paymentMethods: parsePaymentMethods(rest.paymentMethods as string | string[] | undefined) };
};

export const updateCompanyProfile = async (userId: string, changes: Partial<Pick<AuthUser, 'companyName' | 'rccm' | 'taxId' | 'city' | 'phone' | 'companyLogo' | 'primaryColor' | 'secondaryColor' | 'paymentMethods'>>) => {
  const updateData: Record<string, unknown> = {};
  const allowedFields = ['companyName', 'rccm', 'taxId', 'city', 'phone', 'companyLogo', 'primaryColor', 'secondaryColor', 'paymentMethods'] as const;
  for (const field of allowedFields) {
    if (field in changes && changes[field] !== undefined) {
      updateData[field] = field === 'paymentMethods'
        ? JSON.stringify(changes.paymentMethods)
        : changes[field];
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return toPublicCompany(user as unknown as AuthUser);
};

export const registerCompany = async (input: CompanyRegisterInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });
  if (existing) throw new Error('Cet email est déjà associé à un compte.');

  const normalizedPhone = normalizePhone(input.phone);
  const existingPhone = await prisma.user.findFirst({
    where: { phone: normalizedPhone },
  });
  if (existingPhone) throw new Error('Ce numéro est déjà associé à un compte.');

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      firstName: input.contactName.trim(),
      lastName: input.companyName.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      city: input.city.trim(),
      role: 'company',
      provider: 'password',
      passwordHash,
      companyName: input.companyName.trim(),
      rccm: input.rccm.trim(),
      taxId: input.taxId.trim(),
      paymentMethods: JSON.stringify(['Espèces']),
    },
  });

  const token = createToken(user as unknown as AuthUser);
  return { user: toPublicCompany(user as unknown as AuthUser), token };
};

export const loginCompany = async (input: CompanyLoginInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });
  if (!user || user.role !== 'company' || !user.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new Error('Email ou mot de passe incorrect.');
  }
  const token = createToken(user as unknown as AuthUser);
  return { user: toPublicCompany(user as unknown as AuthUser), token };
};

export const googleLoginCompany = async (idToken: string) => {
  const profile = await verifyGoogleIdToken(idToken);

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
        firstName: profile.firstName || profile.fullName || 'Responsable',
        lastName: profile.lastName || 'Compagnie',
        phone: '',
        email: profile.email,
        city: 'Abidjan',
        role: 'company',
        provider: 'google',
        googleId: profile.googleId,
        avatarUrl: profile.picture,
        companyName: profile.fullName || profile.firstName || 'Ma Compagnie',
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

  const token = createToken(user as unknown as AuthUser);
  return { user: toPublicCompany(user as unknown as AuthUser), token };
};

const companyResetCodes = new Map<string, { code: string; expiresAt: number }>();

export const forgotPasswordCompany = async (input: { email?: string; phone?: string }) => {
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();

  let user: AuthUser | null = null;
  let resetKey: string | undefined;

  if (email) {
    user = (await prisma.user.findFirst({ where: { email } })) as unknown as AuthUser | null;
    resetKey = email;
  } else if (phone) {
    const normalized = normalizePhone(phone);
    user = (await prisma.user.findFirst({ where: { phone: normalized } })) as unknown as AuthUser | null;
    resetKey = normalized;
  }

  if (!user || !resetKey) return;

  const code = String(Math.floor(100000 + Math.random() * 900000));
  companyResetCodes.set(resetKey, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  process.stdout.write(`[Vitoo][Company-Forgot] Code pour ${resetKey}: ${code}\n`);

  if (phone && user.phone) {
    await sendSms(user.phone, `Vitoo : votre code de vérification compagnie est ${code}. Il expire dans 5 minutes.`);
  }

  if (email && user.email) {
    const subject = 'Vitoo : réinitialisation de mot de passe compagnie';
    const html = `
      <div style="font-family: Inter, Trebuchet MS, Segoe UI, sans-serif; max-width: 480px; margin: auto; padding: 2rem; color: #10233f;">
        <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Vitoo</h1>
        <p style="color: #77869c; margin-bottom: 1.5rem;">Réinitialisation de mot de passe — Espace Compagnie</p>
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

export const resetPasswordCompany = async (input: { email?: string; phone?: string; code: string; newPassword: string }) => {
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();

  let resetKey: string | undefined;

  if (email) {
    resetKey = email;
  } else if (phone) {
    resetKey = normalizePhone(phone);
  }

  if (!resetKey) throw new Error('Email ou numéro de téléphone obligatoire.');

  const entry = companyResetCodes.get(resetKey);
  if (!entry || entry.code !== input.code || entry.expiresAt < Date.now()) {
    throw new Error('Code de vérification invalide ou expiré.');
  }

  const user = email
    ? await prisma.user.findFirst({ where: { email: resetKey } })
    : await prisma.user.findFirst({ where: { phone: resetKey } });

  if (!user || user.role !== 'company') throw new Error('Compagnie introuvable.');

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, provider: 'password' },
  });

  companyResetCodes.delete(resetKey);
  return toPublicCompany(user as unknown as AuthUser);
};
