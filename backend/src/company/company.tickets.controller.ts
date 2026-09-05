import type { Request, Response } from 'express';
import { randomInt } from 'node:crypto';
import { prisma } from '../lib/db.js';

const DEFAULT_COMMISSION_RATE = 0.08;

export const getTicketsController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const tickets = await prisma.ticket.findMany({
    where: { companyId },
    include: {
      trip: {
        select: {
          id: true,
          depart: true,
          arrivee: true,
          time: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return response.json({
    tickets: tickets.map((t) => ({
      id: t.id,
      tripId: t.tripId,
      companyId: t.companyId,
      passengerName: t.passengerName || '',
      passengerPhone: t.passengerPhone || '',
      seatNumber: t.seatNumber || '',
      amount: t.amount || 0,
      paymentMethod: t.paymentMethod || 'cash',
      soldBy: t.soldBy,
      commissionRate: t.commissionRate || DEFAULT_COMMISSION_RATE,
      commissionAmount: t.commissionAmount || 0,
      companyNet: t.companyNet || 0,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      trip: t.trip ? {
        id: t.trip.id,
        depart: t.trip.depart,
        arrivee: t.trip.arrivee,
        time: t.trip.time,
      } : null,
    })),
  });
};

export const getTicketByIdController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const id = String(request.params.id);
  const ticket = await prisma.ticket.findFirst({
    where: { id, companyId },
    include: {
      trip: {
        select: {
          id: true,
          depart: true,
          arrivee: true,
          time: true,
        },
      },
    },
  });

  if (!ticket) return response.status(404).json({ message: 'Billet introuvable.' });

  return response.json({
    ticket: {
      id: ticket.id,
      tripId: ticket.tripId,
      companyId: ticket.companyId,
      passengerName: ticket.passengerName || '',
      passengerPhone: ticket.passengerPhone || '',
      seatNumber: ticket.seatNumber || '',
      amount: ticket.amount || 0,
      paymentMethod: ticket.paymentMethod || 'cash',
      soldBy: ticket.soldBy,
      commissionRate: ticket.commissionRate || DEFAULT_COMMISSION_RATE,
      commissionAmount: ticket.commissionAmount || 0,
      companyNet: ticket.companyNet || 0,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      trip: ticket.trip ? {
        id: ticket.trip.id,
        depart: ticket.trip.depart,
        arrivee: ticket.trip.arrivee,
        time: ticket.trip.time,
      } : null,
    },
  });
};

export const sellTicketController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const {
    tripId, passengerName, passengerPhone, seatNumber, paymentMethod, soldBy,
  } = request.body as {
    tripId?: string;
    passengerName?: string;
    passengerPhone?: string;
    seatNumber?: string;
    paymentMethod?: string;
    soldBy?: 'online' | 'counter';
  };

  if (!tripId || !passengerName?.trim() || !passengerPhone?.trim() || !paymentMethod) {
    return response.status(400).json({ message: 'Le trajet, le nom, le téléphone du passager et le mode de paiement sont obligatoires.' });
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, companyId },
  });

  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });

  if (trip.availableSeats <= 0) {
    return response.status(409).json({ message: 'Ce trajet est complet.' });
  }

  const amount = trip.price;
  const commissionRate = DEFAULT_COMMISSION_RATE;
  const commissionAmount = Math.round(amount * commissionRate);
  const companyNet = amount - commissionAmount;
  const existingTickets = await prisma.ticket.findMany({
    where: { tripId },
    select: { seatNumber: true },
  });
  const takenSeats = new Set(existingTickets.map((t) => t.seatNumber).filter(Boolean));
  let seat = seatNumber?.trim() || null;
  if (seat && takenSeats.has(seat)) return response.status(409).json({ message: `Le siège ${seat} est déjà réservé.` });
  if (!seat) {
    let candidate = 1;
    while (takenSeats.has(`A${candidate}`)) candidate += 1;
    seat = `A${candidate}`;
  }
  const ticketCode = `TKT-${randomInt(10000000, 99999999)}`;

  const ticket = await prisma.ticket.create({
    data: {
      tripId,
      companyId,
      soldBy: soldBy || 'counter',
      status: 'active',
      code: ticketCode,
      qrData: JSON.stringify({ ticketId: ticketCode, tripId, passengerName, seatNumber: seat, companyId }),
      seatNumber: seat,
      bookingId: null,
      passengerName: passengerName.trim(),
      passengerPhone: passengerPhone.trim(),
      paymentMethod,
      amount,
      commissionRate,
      commissionAmount,
      companyNet,
    },
  });

  await prisma.trip.update({
    where: { id: tripId },
    data: { availableSeats: { decrement: 1 } },
  });

  return response.status(201).json({
    ticket: {
      id: ticket.id,
      code: ticket.code,
      tripId: ticket.tripId,
      companyId: ticket.companyId,
      passengerName: passengerName.trim(),
      passengerPhone: passengerPhone.trim(),
      seatNumber: ticket.seatNumber || '',
      amount,
      paymentMethod,
      soldBy: ticket.soldBy,
      commissionRate,
      commissionAmount,
      companyNet,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
    },
  });
};
