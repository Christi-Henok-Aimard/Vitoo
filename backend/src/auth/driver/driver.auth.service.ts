import type { Driver } from '../../shared/types/company.types.js';
import { prisma } from '../../lib/db.js';
import { createToken, verifyToken, hashPassword, verifyPassword } from '../passenger/auth.crypto.js';
import { sendSms } from '../../notifications/sms.js';
import { randomInt } from 'node:crypto';

export interface DriverAuthUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: 'driver';
  companyId: string;
  provider?: 'password' | 'google';
}

export interface DriverSession {
  token: string;
  driver: DriverAuthUser;
}

const driverResetCodes = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const purgeExpiredDriverResetCodes = () => {
  const now = Date.now();
  for (const [key, entry] of driverResetCodes) {
    if (entry.expiresAt < now) driverResetCodes.delete(key);
  }
};

export const findDriverByPhone = async (phone: string): Promise<Driver | undefined> => {
  const user = await prisma.user.findFirst({
    where: { phone, role: 'driver' },
    include: { driver: true },
  });
  if (!user || !user.driver) return undefined;
  return {
    id: user.driver.id,
    companyId: user.driver.companyId,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email || undefined,
    licenseNumber: user.driver.licenseNumber || undefined,
    status: user.driver.status,
    provider: user.provider,
    passwordHash: user.passwordHash || undefined,
    createdAt: user.driver.createdAt.toISOString(),
  };
};

export const findDriverByEmail = async (email: string): Promise<Driver | undefined> => {
  const user = await prisma.user.findFirst({
    where: { email, role: 'driver' },
    include: { driver: true },
  });
  if (!user || !user.driver) return undefined;
  return {
    id: user.driver.id,
    companyId: user.driver.companyId,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email || undefined,
    licenseNumber: user.driver.licenseNumber || undefined,
    status: user.driver.status,
    provider: user.provider,
    passwordHash: user.passwordHash || undefined,
    createdAt: user.driver.createdAt.toISOString(),
  };
};

export const findDriverById = async (id: string): Promise<Driver | undefined> => {
  const driver = await prisma.driver.findFirst({
    where: { id },
    include: { user: true },
  });
  if (!driver) return undefined;
  return {
    id: driver.id,
    companyId: driver.companyId,
    firstName: driver.user.firstName,
    lastName: driver.user.lastName,
    phone: driver.user.phone,
    email: driver.user.email || undefined,
    licenseNumber: driver.licenseNumber || undefined,
    status: driver.status,
    provider: driver.user.provider,
    passwordHash: driver.user.passwordHash || undefined,
    createdAt: driver.createdAt.toISOString(),
  };
};

export const registerDriver = async (input: { firstName: string; lastName: string; phone: string; email?: string; password: string; companyId: string; licenseNumber?: string }) => {
  const normalizedPhone = input.phone.trim();
  const existingUser = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
  if (existingUser) throw new Error('Ce numéro est déjà associé à un compte chauffeur.');
  if (input.email) {
    const existingEmail = await prisma.user.findFirst({ where: { email: input.email.trim() } });
    if (existingEmail) throw new Error('Cet email est déjà associé à un compte chauffeur.');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: normalizedPhone,
      email: input.email?.trim() || undefined,
      city: '',
      role: 'driver',
      provider: 'password',
      passwordHash,
    },
  });

  const driver = await prisma.driver.create({
    data: {
      userId: user.id,
      companyId: input.companyId,
      licenseNumber: input.licenseNumber?.trim() || null,
      status: 'available',
    },
  });

  const driverAuthUser: DriverAuthUser = {
    id: driver.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email || undefined,
    role: 'driver',
    companyId: driver.companyId,
    provider: 'password',
  };
  const token = createToken(driverAuthUser);
  return { driver: driverAuthUser, token };
};

export const loginDriver = async (phone: string, password: string) => {
  const driver = await findDriverByPhone(phone);
  if (!driver || !driver.passwordHash || !(await verifyPassword(password, driver.passwordHash))) {
    throw new Error('Numéro ou mot de passe incorrect.');
  }
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
  const token = createToken(driverAuthUser);
  return { driver: driverAuthUser, token };
};

export const forgotPasswordDriver = async (phone: string) => {
  purgeExpiredDriverResetCodes();
  const normalized = phone.trim();
  const driver = await findDriverByPhone(normalized);
  if (!driver) return;

  const code = String(randomInt(100000, 1000000));
  driverResetCodes.set(normalized, { code, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });
  process.stdout.write(`[Vitoo][Driver-Forgot] Code pour ${normalized}: ${code}\n`);
  if (driver.phone) {
    await sendSms(driver.phone, `Vitoo : votre code de vérification chauffeur est ${code}. Il expire dans 5 minutes.`);
  }
};

export const resetPasswordDriver = async (phone: string, code: string, newPassword: string) => {
  purgeExpiredDriverResetCodes();
  const normalized = phone.trim();
  const entry = driverResetCodes.get(normalized);
  if (!entry || entry.expiresAt < Date.now()) {
    throw new Error('Code de vérification invalide ou expiré.');
  }
  entry.attempts += 1;
  if (entry.attempts > 5) {
    driverResetCodes.delete(normalized);
    throw new Error('Trop de tentatives. Demandez un nouveau code.');
  }
  if (entry.code !== code) {
    throw new Error('Code de vérification invalide ou expiré.');
  }
  const driver = await findDriverByPhone(normalized);
  if (!driver) throw new Error('Chauffeur introuvable.');
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: (await prisma.driver.findFirst({ where: { id: driver.id }, select: { userId: true } }))?.userId || '' },
    data: { passwordHash, provider: 'password' },
  });
  driverResetCodes.delete(normalized);
  return driver;
};

export const getDriverSession = async (token: string): Promise<DriverAuthUser | undefined> => {
  const payload = verifyToken(token);
  if (!payload) return undefined;
  const driver = await prisma.driver.findFirst({
    where: { OR: [{ userId: payload.sub }, { id: payload.sub }] },
    include: { user: true },
  });
  if (!driver) return undefined;
  return {
    id: driver.id,
    firstName: driver.user.firstName,
    lastName: driver.user.lastName,
    phone: driver.user.phone,
    email: driver.user.email || undefined,
    role: 'driver',
    companyId: driver.companyId,
    provider: ((driver.user.provider as 'password' | 'google') || 'password') as 'password' | 'google',
  };
};

export const setDriverSession = (_token: string, _driver: DriverAuthUser) => {
  void _token;
  void _driver;
};

export const deleteDriverSession = (_token: string) => {
  void _token;
};

export const toPublicDriver = (driver: DriverAuthUser) => {
  const { provider, ...rest } = driver;
  void provider;
  return rest;
};
