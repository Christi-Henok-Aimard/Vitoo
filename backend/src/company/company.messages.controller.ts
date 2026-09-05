import type { Request, Response } from 'express';
import { prisma } from '../lib/db.js';

export const getCompanyMessagesController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const messages = await prisma.message.findMany({
    where: { companyId },
    include: {
      driver: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  await prisma.message.updateMany({
    where: { companyId, sender: 'driver', read: false },
    data: { read: true },
  });

  return response.json({
    messages: messages.map((m) => ({
      id: m.id,
      tripId: m.tripId || undefined,
      driverId: m.driverId,
      driverName: m.driver.user.firstName + ' ' + m.driver.user.lastName,
      driverPhone: m.driver.user.phone,
      sender: m.sender,
      body: m.body,
      read: m.read,
      createdAt: m.createdAt.toISOString(),
    })),
  });
};

export const sendCompanyMessageController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const { driverId, tripId, body } = request.body as { driverId?: string; tripId?: string; body?: string };
  if (!driverId || !body?.trim()) {
    return response.status(400).json({ message: 'Chauffeur et message requis.' });
  }

  const driver = await prisma.driver.findFirst({ where: { id: driverId, companyId } });
  if (!driver) return response.status(404).json({ message: 'Chauffeur introuvable.' });

  const message = await prisma.message.create({
    data: {
      tripId: tripId || null,
      driverId,
      companyId,
      sender: 'company',
      body: body.trim(),
    },
  });

  return response.status(201).json({
    message: {
      id: message.id,
      tripId: message.tripId || undefined,
      driverId: message.driverId,
      sender: message.sender,
      body: message.body,
      read: message.read,
      createdAt: message.createdAt.toISOString(),
    },
  });
};
