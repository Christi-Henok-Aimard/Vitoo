import { randomInt } from 'node:crypto';
import { prisma } from '../../lib/db.js';
import { parsePaymentMethods } from '../../auth/passenger/auth.crypto.js';
import type { Booking, Trip } from './trips.types.js';

const paymentMethodsOf = (raw: string | null): string[] => parsePaymentMethods(raw ?? undefined) ?? [];

const parseStringArray = (raw: string | null): string[] => {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const paymentMethodsOfTrip = (trip: { paymentMethods: string | null }, companyRaw: string | null): string[] => {
  const tripMethods = parsePaymentMethods(trip.paymentMethods ?? undefined) ?? [];
  return tripMethods.length ? tripMethods : paymentMethodsOf(companyRaw);
};

export const tripsStore = {
  async findTrips(params: { depart?: string; arrivee?: string; date?: string; company?: string }) {
    const where: Record<string, unknown> = {};

    if (params.depart) {
      where.depart = { contains: params.depart };
    }
    if (params.arrivee) {
      where.arrivee = { contains: params.arrivee };
    }
    if (params.date) {
      where.date = params.date;
    }
    if (params.company && params.company !== 'Toutes') {
      where.company = { companyName: { contains: params.company } };
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            lastName: true,
            phone: true,
            companyLogo: true,
            primaryColor: true,
            secondaryColor: true,
            paymentMethods: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            ratings: true,
            trips: true,
          },
        },
        vehicle: true,
      },
      orderBy: { time: 'asc' },
    });

    return trips.map((trip) => {
      const ratings = trip.driver?.ratings ?? [];
      const completedTrips = (trip.driver?.trips ?? []).filter((t) => t.status === 'completed').length;
      return {
        id: trip.id,
        company: trip.company.companyName || trip.company.lastName || 'Compagnie',
        companyPhone: trip.company.phone || '',
        companyLogo: trip.company.companyLogo || undefined,
        primaryColor: trip.company.primaryColor || undefined,
        secondaryColor: trip.company.secondaryColor || undefined,
        paymentMethods: paymentMethodsOfTrip(trip, trip.company.paymentMethods),
        depart: trip.depart,
        arrivee: trip.arrivee,
        time: trip.time,
        duration: trip.duration || undefined,
        price: trip.price,
        availableSeats: trip.availableSeats,
        station: trip.station || '',
        driverName: trip.driver ? `${trip.driver.user.firstName} ${trip.driver.user.lastName}` : '',
        driverRating: ratings.length ? Math.round((ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10) / 10 : 0,
        driverTrips: completedTrips,
        driverReview: ratings[0]?.comment || '',
        vehiclePlate: trip.vehicle?.plateNumber || '',
        stops: parseStringArray(trip.stops),
        latitude: trip.latitude ?? undefined,
        longitude: trip.longitude ?? undefined,
        lastPositionAt: trip.lastPositionAt?.toISOString() || undefined,
      };
    }) as Trip[];
  },

  async findTripById(id: string) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            lastName: true,
            phone: true,
            companyLogo: true,
            primaryColor: true,
            secondaryColor: true,
            paymentMethods: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            ratings: true,
            trips: true,
          },
        },
        vehicle: true,
      },
    });

    if (!trip) return null;

    const ratings = trip.driver?.ratings ?? [];
    const completedTrips = (trip.driver?.trips ?? []).filter((t) => t.status === 'completed').length;

    return {
      id: trip.id,
      company: trip.company.companyName || trip.company.lastName || 'Compagnie',
      companyPhone: trip.company.phone || '',
      companyLogo: trip.company.companyLogo || undefined,
      primaryColor: trip.company.primaryColor || undefined,
      secondaryColor: trip.company.secondaryColor || undefined,
      paymentMethods: paymentMethodsOfTrip(trip, trip.company.paymentMethods),
      depart: trip.depart,
      arrivee: trip.arrivee,
      time: trip.time,
      duration: trip.duration || undefined,
      price: trip.price,
      availableSeats: trip.availableSeats,
      station: trip.station || '',
      driverName: trip.driver ? `${trip.driver.user.firstName} ${trip.driver.user.lastName}` : '',
      driverRating: ratings.length ? Math.round((ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10) / 10 : 0,
      driverTrips: completedTrips,
      driverReview: ratings[0]?.comment || '',
      vehiclePlate: trip.vehicle?.plateNumber || '',
      stops: parseStringArray(trip.stops),
      latitude: trip.latitude ?? undefined,
      longitude: trip.longitude ?? undefined,
      lastPositionAt: trip.lastPositionAt?.toISOString() || undefined,
    } as Trip;
  },

  async listCompanies() {
    const companies = await prisma.user.findMany({
      where: { role: 'company' },
      select: {
        companyName: true,
        lastName: true,
      },
    });
    return [...new Set(companies.map((c) => c.companyName || c.lastName))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'fr'));
  },

  async listBookingsForUser(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        trip: {
          include: {
            company: {
              select: {
                id: true,
                companyName: true,
                lastName: true,
                phone: true,
                companyLogo: true,
                primaryColor: true,
                secondaryColor: true,
                paymentMethods: true,
              },
            },
            driver: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                ratings: true,
                trips: true,
              },
            },
            vehicle: true,
          },
        },
        ticket: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings
      .map((b) => {
        const trip = b.trip;
        if (!trip) return null;
        const ratings = trip.driver?.ratings ?? [];
        const completedTrips = (trip.driver?.trips ?? []).filter((t) => t.status === 'completed').length;
        return {
          id: b.id,
          tripId: b.tripId,
          userId: b.userId,
          passengerName: b.passengerName,
          passengerPhone: b.passengerPhone,
          passengerEmail: b.passengerEmail || undefined,
          seats: b.seats,
          seatNumber: b.seatNumber || undefined,
          amount: b.amount ?? undefined,
          paymentMethod: b.paymentMethod,
          status: b.status,
          createdAt: b.createdAt.toISOString(),
          trip: {
            id: trip.id,
            company: trip.company.companyName || trip.company.lastName || 'Compagnie',
            companyPhone: trip.company.phone || '',
            companyLogo: trip.company.companyLogo || undefined,
            primaryColor: trip.company.primaryColor || undefined,
            secondaryColor: trip.company.secondaryColor || undefined,
            paymentMethods: paymentMethodsOfTrip(trip, trip.company.paymentMethods),
            depart: trip.depart,
            arrivee: trip.arrivee,
            time: trip.time,
            duration: trip.duration || undefined,
            price: trip.price,
            availableSeats: trip.availableSeats,
            station: trip.station || '',
            driverName: trip.driver ? `${trip.driver.user.firstName} ${trip.driver.user.lastName}` : '',
            driverRating: ratings.length ? Math.round((ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10) / 10 : 0,
            driverTrips: completedTrips,
            driverReview: ratings[0]?.comment || '',
            vehiclePlate: trip.vehicle?.plateNumber || '',
            stops: parseStringArray(trip.stops),
            latitude: trip.latitude ?? undefined,
            longitude: trip.longitude ?? undefined,
            lastPositionAt: trip.lastPositionAt?.toISOString() || undefined,
          } as Trip,
          ticket: b.ticket
            ? {
                id: b.ticket.id,
                code: b.ticket.code,
                status: b.ticket.status,
                seatNumber: b.ticket.seatNumber || undefined,
                passengerName: b.ticket.passengerName || undefined,
                passengerPhone: b.ticket.passengerPhone || undefined,
                paymentMethod: b.ticket.paymentMethod || undefined,
                amount: b.ticket.amount ?? undefined,
                soldBy: b.ticket.soldBy,
                commissionRate: b.ticket.commissionRate ?? undefined,
                commissionAmount: b.ticket.commissionAmount ?? undefined,
                companyNet: b.ticket.companyNet ?? undefined,
                createdAt: b.ticket.createdAt.toISOString(),
              }
            : undefined,
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);
  },

  async createBooking(input: Omit<Booking, 'id' | 'createdAt' | 'status'>) {
    const trip = await prisma.trip.findUnique({
      where: { id: input.tripId },
    });

    if (!trip) return { error: 'Trajet introuvable.' };
    if (trip.availableSeats <= 0) return { error: 'Ce trajet est complet.' };

    const existingTickets = await prisma.ticket.findMany({
      where: { tripId: input.tripId },
      select: { seatNumber: true },
    });
    const takenSeats = new Set(existingTickets.map((t) => t.seatNumber).filter(Boolean));
    let seatNumber = input.seatNumber || null;
    if (seatNumber && takenSeats.has(seatNumber)) return { error: `Le siège ${seatNumber} est déjà réservé.` };
    if (!seatNumber) {
      let candidate = 1;
      while (takenSeats.has(`A${candidate}`)) candidate += 1;
      seatNumber = `A${candidate}`;
    }

    const booking = await prisma.booking.create({
      data: {
        userId: input.userId || '',
        tripId: input.tripId,
        passengerName: input.passengerName,
        passengerPhone: input.passengerPhone,
        passengerEmail: input.passengerEmail || null,
        seats: input.seats || 1,
        seatNumber,
        amount: input.amount || 0,
        paymentMethod: input.paymentMethod,
        status: 'confirmed',
      },
    });

    await prisma.trip.update({
      where: { id: input.tripId },
      data: {
        availableSeats: { decrement: 1 },
      },
    });

    const commissionRate = 0.08;
    const commissionAmount = Math.round((input.amount || trip.price) * commissionRate);
    const companyNet = (input.amount || trip.price) - commissionAmount;
    const ticketCode = `TKT-${randomInt(10000000, 99999999)}`;
    const ticket = await prisma.ticket.create({
      data: {
        bookingId: booking.id,
        tripId: input.tripId,
        companyId: trip.companyId,
        soldBy: 'online',
        status: 'active',
        code: ticketCode,
        qrData: JSON.stringify({ bookingId: booking.id, tripId: input.tripId, code: ticketCode, seatNumber }),
        seatNumber,
        passengerName: input.passengerName,
        passengerPhone: input.passengerPhone,
        paymentMethod: input.paymentMethod,
        amount: input.amount || trip.price,
        commissionRate,
        commissionAmount,
        companyNet,
      },
    });

    return {
      ...booking,
      seatNumber,
      ticket: {
        id: ticket.id,
        tripId: ticket.tripId,
        companyId: ticket.companyId,
        code: ticket.code,
        passengerName: ticket.passengerName,
        passengerPhone: ticket.passengerPhone,
        seatNumber: ticket.seatNumber,
        amount: ticket.amount,
        paymentMethod: ticket.paymentMethod,
        soldBy: ticket.soldBy,
        commissionRate: ticket.commissionRate,
        commissionAmount: ticket.commissionAmount,
        companyNet: ticket.companyNet,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
      },
    } as unknown as Booking;
  },

  async rateTrip(input: { tripId: string; userId: string; stars: number; comment?: string }) {
    const trip = await prisma.trip.findUnique({
      where: { id: input.tripId },
      select: { id: true, driverId: true },
    });
    if (!trip) return { error: 'Trajet introuvable.' };
    if (!trip.driverId) return { error: 'Ce trajet n\'a pas de chauffeur assigné.' };
    if (input.stars < 1 || input.stars > 5) return { error: 'La note doit être comprise entre 1 et 5.' };

    const rating = await prisma.rating.upsert({
      where: { userId_tripId: { userId: input.userId, tripId: input.tripId } },
      update: { stars: input.stars, comment: input.comment?.trim() || null },
      create: {
        tripId: input.tripId,
        driverId: trip.driverId,
        userId: input.userId,
        stars: input.stars,
        comment: input.comment?.trim() || null,
      },
    });

    return { rating };
  },

  async completeBooking(id: string, userId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id, userId },
    });

    if (!booking) return undefined;

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'completed' },
    });

    return updated as unknown as Booking;
  },
};
