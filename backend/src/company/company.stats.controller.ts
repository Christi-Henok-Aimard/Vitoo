import type { Request, Response } from 'express';
import { prisma } from '../lib/db.js';

export const getStatsController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const tickets = await prisma.ticket.findMany({
    where: { companyId },
  });

  const trips = await prisma.trip.findMany({
    where: { companyId },
  });

  const totalSales = tickets.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCommission = tickets.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);
  const totalNet = tickets.reduce((sum, t) => sum + (t.companyNet || 0), 0);
  const totalTickets = tickets.length;
  const onlineTickets = tickets.filter((t) => t.soldBy === 'online').length;
  const counterTickets = tickets.filter((t) => t.soldBy === 'counter').length;
  const activeTrips = trips.filter((t) => ['scheduled', 'boarding', 'in_transit'].includes(t.status)).length;
  const completedTrips = trips.filter((t) => t.status === 'completed').length;

  return response.json({
    stats: {
      totalSales,
      totalCommission,
      totalNet,
      totalTickets,
      onlineTickets,
      counterTickets,
      activeTrips,
      completedTrips,
    },
  });
};
