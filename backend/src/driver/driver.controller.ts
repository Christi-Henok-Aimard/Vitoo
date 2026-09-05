import type { Request, Response } from 'express';
import type { CompanyTrip, DriverStats } from '../shared/types/company.types.js';
import { prisma } from '../lib/db.js';
import { getDriverSession } from '../auth/driver/driver.auth.service.js';
import { sendSms } from '../notifications/sms.js';
import { parsePaymentMethods } from '../auth/passenger/auth.crypto.js';

const parseStringArray = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const toCompanyTrip = (trip: {
  id: string;
  companyId: string;
  depart: string;
  arrivee: string;
  station: string | null;
  time: string;
  date: Date;
  duration: string | null;
  price: number;
  availableSeats: number;
  paymentMethods: string;
  stops: string;
  latitude: number | null;
  longitude: number | null;
  lastPositionAt: Date | null;
  status: CompanyTrip['status'];
  createdAt: Date;
  vehicleId: string | null;
  driverId: string | null;
  company: { companyName: string | null; phone: string | null };
  vehicle: { id: string; plateNumber: string; model: string | null; brand: string | null; color: string | null; capacity: number | null } | null;
}): CompanyTrip => ({
  id: trip.id,
  companyId: trip.companyId,
  depart: trip.depart,
  arrivee: trip.arrivee,
  station: trip.station || '',
  time: trip.time,
  date: trip.date.toISOString().split('T')[0],
  duration: trip.duration || '',
  price: trip.price,
  availableSeats: trip.availableSeats,
  totalSeats: trip.vehicle?.capacity || trip.availableSeats,
  vehicleId: trip.vehicleId || '',
  driverId: trip.driverId || '',
  paymentMethods: parsePaymentMethods(trip.paymentMethods) ?? [],
  stops: parseStringArray(trip.stops),
  latitude: trip.latitude ?? undefined,
  longitude: trip.longitude ?? undefined,
  lastPositionAt: trip.lastPositionAt?.toISOString() || undefined,
  status: trip.status,
  createdAt: trip.createdAt.toISOString(),
  company: trip.company.companyName || '',
  vehicle: trip.vehicle ? {
    id: trip.vehicle.id,
    plate: trip.vehicle.plateNumber,
    model: trip.vehicle.model || '',
    brand: trip.vehicle.brand || '',
    color: trip.vehicle.color || '',
    capacity: trip.vehicle.capacity || 0,
  } : null,
});

const getPassengerName = (accountName: { firstName?: string | null; lastName?: string | null } | null | undefined, passengerName?: string | null) => {
  if (accountName?.firstName || accountName?.lastName) {
    return [accountName.firstName, accountName.lastName].filter(Boolean).join(' ').trim();
  }
  return (passengerName && passengerName.trim()) || '';
};

const findTicketByInput = async (ticketId: string | undefined, backupCode: string | undefined, companyId: string) => {
  const rawId = (ticketId || '').trim();
  if (rawId) {
    return prisma.ticket.findFirst({
      where: { OR: [{ id: rawId }, { code: rawId }, { code: rawId.toUpperCase() }] },
      include: { trip: true, booking: { include: { user: true } } },
    });
  }
  const lookupCode = (backupCode || '').trim();
  if (lookupCode) {
    const allTickets = await prisma.ticket.findMany({
      where: { companyId },
      include: { trip: true, booking: { include: { user: true } } },
    });
    return allTickets.find((t) => t.code === lookupCode || t.code === lookupCode.toUpperCase());
  }
  return null;
};

export const getDriverTripsController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const trips = await prisma.trip.findMany({
    where: { driverId: driver.id, companyId: driver.companyId },
    include: {
      company: {
        select: {
          companyName: true,
          phone: true,
        },
      },
      vehicle: true,
    },
    orderBy: { date: 'asc' },
  });

  return response.json({
    trips: trips.map((trip) => toCompanyTrip(trip)),
  });
};

export const getDriverTripByIdController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const tripId = String(request.params.id);
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, driverId: driver.id, companyId: driver.companyId },
    include: {
      company: {
        select: {
          companyName: true,
          phone: true,
        },
      },
      vehicle: true,
      tickets: {
        include: {
          booking: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });

  const driverInfo = trip.driverId ? await prisma.driver.findFirst({
    where: { id: trip.driverId },
    include: { user: true },
  }) : null;

  return response.json({
    trip: toCompanyTrip(trip),
    tickets: trip.tickets.map((t) => ({
      id: t.id,
      tripId: t.tripId,
      companyId: t.companyId,
      code: t.code,
      qrData: t.qrData || undefined,
      passengerName: getPassengerName(t.booking?.user, t.passengerName) || 'Passager',
      passengerPhone: t.booking?.user.phone || t.passengerPhone || '',
      seatNumber: t.seatNumber || '',
      amount: t.amount || 0,
      paymentMethod: t.paymentMethod || 'cash',
      soldBy: t.soldBy,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
    driver: driverInfo ? {
      id: driverInfo.id,
      companyId: driverInfo.companyId,
      firstName: driverInfo.user.firstName,
      lastName: driverInfo.user.lastName,
      phone: driverInfo.user.phone,
      email: driverInfo.user.email,
      licenseNumber: driverInfo.licenseNumber,
      status: driverInfo.status,
      provider: driverInfo.user.provider,
      createdAt: driverInfo.createdAt.toISOString(),
    } : null,
    vehicle: trip.vehicle ? {
      id: trip.vehicle.id,
      companyId: trip.companyId,
      plate: trip.vehicle.plateNumber,
      brand: trip.vehicle.brand || '',
      model: trip.vehicle.model || '',
      capacity: trip.vehicle.capacity || 0,
      color: trip.vehicle.color || '',
      status: 'available',
      createdAt: trip.vehicle.createdAt.toISOString(),
    } : null,
  });
};

export const updateDriverStatusController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const { status } = request.body as { status?: 'available' | 'on_trip' | 'off_duty' };
  if (!status) return response.status(400).json({ message: 'Statut manquant.' });

  const updated = await prisma.driver.update({
    where: { id: driver.id },
    data: { status },
    include: { user: true },
  });

  return response.json({
    driver: {
      id: updated.id,
      companyId: updated.companyId,
      firstName: updated.user.firstName,
      lastName: updated.user.lastName,
      phone: updated.user.phone,
      email: updated.user.email,
      licenseNumber: updated.licenseNumber,
      status: updated.status,
      provider: updated.user.provider,
      createdAt: updated.createdAt.toISOString(),
    },
  });
};

export const updateTripStatusController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const tripId = String(request.params.id);
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, driverId: driver.id, companyId: driver.companyId },
  });
  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });

  const { status } = request.body as { status?: 'scheduled' | 'boarding' | 'in_transit' | 'completed' | 'cancelled' };
  if (!status) return response.status(400).json({ message: 'Statut manquant.' });

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { status },
    include: { vehicle: true },
  });

  return response.json({
    trip: {
      id: updated.id,
      companyId: updated.companyId,
      depart: updated.depart,
      arrivee: updated.arrivee,
      station: updated.station || '',
      time: updated.time,
      date: updated.date.toISOString().split('T')[0],
      duration: updated.duration || '',
      price: updated.price,
      availableSeats: updated.availableSeats,
      totalSeats: updated.vehicle?.capacity || updated.availableSeats,
      vehicleId: updated.vehicleId || '',
      driverId: updated.driverId || '',
      paymentMethods: [],
      stops: [],
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
    },
  });
};

export const updateTripPositionController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const tripId = String(request.params.id);
  const { latitude, longitude } = request.body as { latitude?: number; longitude?: number };
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return response.status(400).json({ message: 'Latitude et longitude requises.' });
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, driverId: driver.id, companyId: driver.companyId },
  });
  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { latitude, longitude, lastPositionAt: new Date() },
  });

  return response.json({
    position: { latitude: updated.latitude, longitude: updated.longitude, lastPositionAt: updated.lastPositionAt?.toISOString() },
  });
};

export const reportIncidentController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const { tripId, type, description, position } = request.body as {
    tripId?: string;
    type?: 'mechanical' | 'delay' | 'road' | 'passenger' | 'other';
    description?: string;
    position?: string;
  };

  if (!tripId || !type) {
    return response.status(400).json({ message: 'Trajet et type d\'incident obligatoires.' });
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, driverId: driver.id, companyId: driver.companyId },
  });
  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });

  const incident = await prisma.incident.create({
    data: {
      tripId,
      driverId: driver.id,
      companyId: driver.companyId,
      type,
      description: description?.trim() || null,
    },
  });

  return response.status(201).json({
    incident: {
      id: incident.id,
      tripId: incident.tripId,
      driverId: incident.driverId,
      companyId: incident.companyId,
      type: incident.type,
      description: incident.description || undefined,
      position: position?.trim() || undefined,
      createdAt: incident.createdAt.toISOString(),
    },
  });
};

export const validateTicketController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const { ticketId, backupCode } = request.body as { ticketId?: string; backupCode?: string };
  if (!ticketId && !backupCode) {
    return response.status(400).json({ message: 'Ticket ou code de secours obligatoire.' });
  }

  const ticket = await findTicketByInput(ticketId, backupCode, driver.companyId);
  if (!ticket) {
    return response.status(404).json({ message: 'Billet introuvable. Vérifiez le code.' });
  }

  if (!ticket.trip || ticket.trip.driverId !== driver.id) {
    return response.status(403).json({ message: 'Ce billet ne correspond pas à votre trajet.' });
  }

  if (ticket.status === 'used') {
    const used = {
      ...ticket,
      tripId: ticket.tripId,
      companyId: ticket.companyId,
      code: ticket.code,
      passengerName: getPassengerName(ticket.booking?.user, ticket.passengerName),
      passengerPhone: ticket.booking?.user.phone || ticket.passengerPhone || '',
      seatNumber: ticket.seatNumber || '',
      guestEmail: ticket.booking?.user.email || undefined,
      status: 'used' as const,
    };
    return response.status(409).json({ message: 'Ce billet a déjà été utilisé.', ticket: used });
  }

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: 'used', validatedBy: driver.id, validatedAt: new Date() },
    include: { booking: { include: { user: true } } },
  });

  return response.json({
    ticket: {
      id: updated.id,
      tripId: updated.tripId,
      companyId: updated.companyId,
      code: updated.code,
      passengerName: getPassengerName(updated.booking?.user, updated.passengerName),
      passengerPhone: updated.booking?.user.phone || updated.passengerPhone || '',
      seatNumber: updated.seatNumber || '',
      amount: updated.amount || 0,
      paymentMethod: updated.paymentMethod || 'cash',
      soldBy: updated.soldBy,
      status: updated.status,
      validatedAt: updated.validatedAt?.toISOString() || undefined,
      createdAt: updated.createdAt.toISOString(),
    },
  });
};

export const lookupTicketController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const { ticketId, backupCode } = request.body as { ticketId?: string; backupCode?: string };
  if (!ticketId && !backupCode) {
    return response.status(400).json({ message: 'Ticket ou code de secours obligatoire.' });
  }

  const ticket = await findTicketByInput(ticketId, backupCode, driver.companyId);
  if (!ticket) {
    return response.status(404).json({ message: 'Billet introuvable. Vérifiez le code.' });
  }

  if (!ticket.trip || ticket.trip.driverId !== driver.id) {
    return response.status(403).json({ message: 'Ce billet ne correspond pas à votre trajet.' });
  }

  return response.json({
    ticket: {
      id: ticket.id,
      tripId: ticket.tripId,
      companyId: ticket.companyId,
      code: ticket.code,
      passengerName: getPassengerName(ticket.booking?.user, ticket.passengerName) || 'Passager',
      passengerPhone: ticket.booking?.user.phone || ticket.passengerPhone || '',
      seatNumber: ticket.seatNumber || '',
      amount: ticket.amount || 0,
      paymentMethod: ticket.paymentMethod || 'cash',
      soldBy: ticket.soldBy,
      status: ticket.status,
      validatedAt: ticket.validatedAt?.toISOString() || undefined,
      createdAt: ticket.createdAt.toISOString(),
    },
    trip: {
      id: ticket.trip.id,
      depart: ticket.trip.depart,
      arrivee: ticket.trip.arrivee,
      time: ticket.trip.time,
    },
  });
};

export const getDriverStatsController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const completedTrips = await prisma.trip.findMany({
    where: { driverId: driver.id, status: 'completed' },
  });

  const tripIds = completedTrips.map((t) => t.id);
  const tickets = await prisma.ticket.findMany({
    where: { tripId: { in: tripIds }, status: 'used' },
  });

  const totalKm = completedTrips.reduce((sum, trip) => {
    const dur = parseFloat(trip.duration || '0');
    return sum + dur * 150;
  }, 0);

  const ratings = await prisma.rating.findMany({
    where: { driverId: driver.id },
    select: { stars: true },
  });
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10) / 10
    : 0;

  const stats: DriverStats = {
    tripsCompleted: completedTrips.length,
    passengersTransported: tickets.length,
    kilometersDriven: Math.round(totalKm),
    averageRating,
  };

  return response.json({ stats });
};

export const notifyAbsentController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const tripId = String(request.params.id);
  const { message: body } = request.body as { message?: string };

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, driverId: driver.id, companyId: driver.companyId },
  });
  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });

  const absentTickets = await prisma.ticket.findMany({
    where: { tripId, status: 'active' },
    select: { passengerPhone: true, code: true, seatNumber: true },
  });

  const notified = { count: 0, phones: [] as string[] };
  for (const t of absentTickets) {
    if (t.passengerPhone) {
      try {
        await sendSms(
          t.passengerPhone,
          body || `Vitoo : le bus ${trip.depart} → ${trip.arrivee} part bientôt. Votre siège ${t.seatNumber} vous attend.`,
        );
        notified.count += 1;
        notified.phones.push(t.passengerPhone);
      } catch {
        // ignore SMS errors
      }
    }
  }

  return response.json({ notified });
};

export const getDriverMessagesController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const messages = await prisma.message.findMany({
    where: { driverId: driver.id, companyId: driver.companyId },
    orderBy: { createdAt: 'asc' },
  });

  // Mark company messages as read
  await prisma.message.updateMany({
    where: { driverId: driver.id, companyId: driver.companyId, sender: 'company', read: false },
    data: { read: true },
  });

  return response.json({
    messages: messages.map((m) => ({
      id: m.id,
      tripId: m.tripId || undefined,
      sender: m.sender,
      body: m.body,
      read: m.read,
      createdAt: m.createdAt.toISOString(),
    })),
  });
};

export const sendDriverMessageController = async (request: Request, response: Response) => {
  const driver = await getDriverSession(request.headers.authorization?.replace('Bearer ', '') || '');
  if (!driver) return response.status(401).json({ message: 'Non authentifié.' });

  const { tripId, body } = request.body as { tripId?: string; body?: string };
  if (!body?.trim()) return response.status(400).json({ message: 'Message requis.' });

  const message = await prisma.message.create({
    data: {
      tripId: tripId || null,
      driverId: driver.id,
      companyId: driver.companyId,
      sender: 'driver',
      body: body.trim(),
    },
  });

  return response.status(201).json({
    message: {
      id: message.id,
      tripId: message.tripId || undefined,
      sender: message.sender,
      body: message.body,
      read: message.read,
      createdAt: message.createdAt.toISOString(),
    },
  });
};
