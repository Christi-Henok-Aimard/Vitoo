import type { Request, Response } from 'express';
import { prisma } from '../lib/db.js';
import { sendSms } from '../notifications/sms.js';
import type { DriverStatus } from '@prisma/client';

export const getDriversController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const drivers = await prisma.driver.findMany({
    where: { companyId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          provider: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return response.json({
    drivers: drivers.map((d) => ({
      id: d.id,
      companyId: d.companyId,
      firstName: d.user.firstName,
      lastName: d.user.lastName,
      phone: d.user.phone,
      email: d.user.email,
      licenseNumber: d.licenseNumber,
      status: d.status,
      provider: d.user.provider,
      createdAt: d.createdAt.toISOString(),
    })),
  });
};

export const addDriverController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const { firstName, lastName, phone, licenseNumber } = request.body as {
    firstName?: string;
    lastName?: string;
    phone?: string;
    licenseNumber?: string;
  };

  if (!firstName?.trim() || !lastName?.trim() || !phone?.trim()) {
    return response.status(400).json({ message: 'Le prénom, le nom et le téléphone sont obligatoires.' });
  }

  const normalizedPhone = phone.trim();

  const company = await prisma.user.findFirst({
    where: { id: companyId },
    select: { companyName: true, lastName: true },
  });
  const companyName = company?.companyName || company?.lastName || 'une compagnie';

  // Sécurité : le mot de passe est personnel. La compagnie ne peut ajouter qu'un
  // chauffeur possédant déjà un compte passager Vitoo ; c'est le passager qui gère
  // son inscription et son mot de passe.
  const user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });

  if (!user) {
    return response.status(400).json({
      message: "Ce numéro n'a pas de compte passager Vitoo. Le chauffeur doit d'abord créer son compte passager avant d'être ajouté.",
    });
  }

  if (user.role !== 'passenger') {
    return response.status(400).json({ message: "Ce numéro n'est pas un compte passager. Seul un compte passager Vitoo peut devenir chauffeur." });
  }

  // S'il appartient déjà à un chauffeur d'une autre compagnie, on bloque.
  const owned = await prisma.driver.findFirst({ where: { userId: user.id, companyId: { not: companyId } } });
  if (owned) {
    return response.status(409).json({ message: 'Ce numéro est déjà un chauffeur d\'une autre compagnie.' });
  }

  const driver = await prisma.driver.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      companyId,
      licenseNumber: licenseNumber?.trim() || null,
      status: 'available',
    },
    update: {
      companyId,
      licenseNumber: licenseNumber?.trim() || null,
      status: 'available',
    },
  });

  try {
    // Notification in-app : le chauffeur la verra dans son espace chauffeur (onglet messages).
    await prisma.message.create({
      data: {
        driverId: driver.id,
        companyId,
        sender: 'company',
        body: `Bienvenue ! ${companyName} vous a ajouté comme chauffeur. Votre espace chauffeur est maintenant actif dans votre application Vitoo.`,
      },
    });
  } catch (cause) {
    console.error('[Vitoo][Notification] Échec de la notification in-app :', cause);
  }

  try {
    await sendSms(
      normalizedPhone,
      `Vitoo : ${companyName} vous a ajouté comme chauffeur. Connectez-vous à votre espace passager Vitoo avec ce numéro : votre espace chauffeur est maintenant actif.`,
    );
  } catch (cause) {
    console.error('[Vitoo][SMS] Échec de l\'envoi :', cause);
  }

  return response.status(201).json({
    message: 'Chauffeur ajouté. Son espace chauffeur est actif sur son compte passager ; il en est notifié par SMS et dans l\'application.',
    driver: {
      id: driver.id,
      companyId: driver.companyId,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      licenseNumber: driver.licenseNumber,
      status: driver.status,
      provider: user.provider,
      createdAt: driver.createdAt.toISOString(),
    },
  });
};

export const updateDriverController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const id = String(request.params.id);
  const driver = await prisma.driver.findFirst({
    where: { id, companyId },
    include: { user: true },
  });

  if (!driver) return response.status(404).json({ message: 'Chauffeur introuvable.' });

  const { firstName, lastName, phone, licenseNumber, status } = request.body as {
    firstName?: string;
    lastName?: string;
    phone?: string;
    licenseNumber?: string;
    status?: string;
  };

  const updateData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    licenseNumber?: string;
    status?: string;
  } = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
  if (status !== undefined) updateData.status = status;

  const updatedUser = await prisma.user.update({
    where: { id: driver.userId },
    data: {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      phone: updateData.phone,
    },
  });

  const updatedDriver = await prisma.driver.update({
    where: { id: driver.id },
    data: {
      licenseNumber: updateData.licenseNumber,
      status: updateData.status as DriverStatus | undefined,
    },
  });

  return response.json({
    driver: {
      id: updatedDriver.id,
      companyId: updatedDriver.companyId,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      email: updatedUser.email,
      licenseNumber: updatedDriver.licenseNumber,
      status: updatedDriver.status,
      provider: updatedUser.provider,
      createdAt: updatedDriver.createdAt.toISOString(),
    },
  });
};

export const deleteDriverController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const id = String(request.params.id);
  const driver = await prisma.driver.findFirst({
    where: { id, companyId },
  });

  if (!driver) return response.status(404).json({ message: 'Chauffeur introuvable.' });

  await prisma.driver.delete({ where: { id: driver.id } });
  await prisma.user.delete({ where: { id: driver.userId } });

  return response.json({ message: 'Chauffeur supprimé.' });
};
