import type { Request, Response } from 'express';
import { prisma } from '../lib/db.js';
import { parsePaymentMethods } from '../auth/passenger/auth.crypto.js';

const parseStringArray = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value || '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const getTripsController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const trips = await prisma.trip.findMany({
    where: { companyId },
    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
      },
      vehicle: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return response.json({
    trips: trips.map((trip) => ({
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
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      paymentMethods: parsePaymentMethods(trip.paymentMethods ?? '[]') ?? [],
      stops: parseStringArray(trip.stops ?? '[]'),
      status: trip.status,
      latitude: trip.latitude ?? undefined,
      longitude: trip.longitude ?? undefined,
      lastPositionAt: trip.lastPositionAt?.toISOString() || undefined,
      createdAt: trip.createdAt.toISOString(),
      driver: trip.driver ? {
        id: trip.driver.id,
        firstName: trip.driver.user.firstName,
        lastName: trip.driver.user.lastName,
        phone: trip.driver.user.phone,
      } : null,
      vehicle: trip.vehicle ? {
        id: trip.vehicle.id,
        plateNumber: trip.vehicle.plateNumber,
        brand: trip.vehicle.brand || '',
        model: trip.vehicle.model,
        capacity: trip.vehicle.capacity,
        color: trip.vehicle.color || '',
        photo: trip.vehicle.photo || undefined,
      } : null,
    })),
  });
};

export const getTripByIdController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const id = String(request.params.id);
  const trip = await prisma.trip.findFirst({
    where: { id, companyId },
    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
      },
      vehicle: true,
      tickets: true,
    },
  });

  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });

  return response.json({
    trip: {
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
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      paymentMethods: parsePaymentMethods(trip.paymentMethods ?? '[]') ?? [],
      stops: parseStringArray(trip.stops ?? '[]'),
      status: trip.status,
      latitude: trip.latitude ?? undefined,
      longitude: trip.longitude ?? undefined,
      lastPositionAt: trip.lastPositionAt?.toISOString() || undefined,
      createdAt: trip.createdAt.toISOString(),
      driver: trip.driver ? {
        id: trip.driver.id,
        firstName: trip.driver.user.firstName,
        lastName: trip.driver.user.lastName,
        phone: trip.driver.user.phone,
      } : null,
      vehicle: trip.vehicle ? {
        id: trip.vehicle.id,
        plateNumber: trip.vehicle.plateNumber,
        brand: trip.vehicle.brand || '',
        model: trip.vehicle.model,
        capacity: trip.vehicle.capacity,
        color: trip.vehicle.color || '',
        photo: trip.vehicle.photo || undefined,
      } : null,
    },
    tickets: trip.tickets.map((t) => ({
      id: t.id,
      tripId: t.tripId,
      companyId: t.companyId,
      code: t.code,
      passengerName: t.passengerName || '',
      passengerPhone: t.passengerPhone || '',
      seatNumber: t.seatNumber || '',
      amount: t.amount || 0,
      paymentMethod: t.paymentMethod || 'cash',
      soldBy: t.soldBy,
      commissionRate: t.commissionRate || 0.08,
      commissionAmount: t.commissionAmount || 0,
      companyNet: t.companyNet || 0,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
    driver: trip.driver ? {
      id: trip.driver.id,
      firstName: trip.driver.user.firstName,
      lastName: trip.driver.user.lastName,
      phone: trip.driver.user.phone,
      email: trip.driver.user.email,
      licenseNumber: trip.driver.licenseNumber,
      status: trip.driver.status,
      createdAt: trip.driver.createdAt.toISOString(),
    } : null,
    vehicle: trip.vehicle ? {
      id: trip.vehicle.id,
      companyId: trip.vehicle.companyId,
      plate: trip.vehicle.plateNumber,
      brand: trip.vehicle.brand || '',
      model: trip.vehicle.model,
      capacity: trip.vehicle.capacity,
      color: trip.vehicle.color || '',
      photo: trip.vehicle.photo || undefined,
      status: trip.vehicle.isActive ? 'available' : 'maintenance',
      createdAt: trip.vehicle.createdAt.toISOString(),
    } : null,
  });
};

export const addTripController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const {
    depart, arrivee, station, time, date, duration, price,
    totalSeats, vehicleId, driverId,
  } = request.body as {
    depart?: string;
    arrivee?: string;
    station?: string;
    time?: string;
    date?: string;
    duration?: string;
    price?: number;
    totalSeats?: number;
    vehicleId?: string;
    driverId?: string;
    paymentMethods?: string[];
    stops?: string[];
  };

  if (!depart?.trim() || !arrivee?.trim() || !station?.trim() || !time?.trim() || !date?.trim() || !price || !totalSeats || !vehicleId || !driverId) {
    return response.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });
  }

  const paymentMethods = Array.isArray(request.body.paymentMethods) ? request.body.paymentMethods.filter((m: unknown): m is string => typeof m === 'string') : [];
  const stops = Array.isArray(request.body.stops) ? request.body.stops.filter((s: unknown): s is string => typeof s === 'string') : [];

  const trip = await prisma.trip.create({
    data: {
      companyId,
      driverId,
      vehicleId,
      depart: depart.trim(),
      arrivee: arrivee.trim(),
      station: station.trim(),
      time: time.trim(),
      date: new Date(date),
      duration: duration?.trim() || '',
      price: Number(price),
      availableSeats: Number(totalSeats),
      paymentMethods: JSON.stringify(paymentMethods),
      stops: JSON.stringify(stops),
      status: 'scheduled',
    },
  });

  return response.status(201).json({
    trip: {
      id: trip.id,
      companyId: trip.companyId,
      depart: trip.depart,
      arrivee: trip.arrivee,
      station: trip.station || '',
      time: trip.time,
      date: trip.date.toISOString().split('T')[0],
      duration: trip.duration,
      price: trip.price,
      availableSeats: trip.availableSeats,
      totalSeats: trip.availableSeats,
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      paymentMethods: parsePaymentMethods(trip.paymentMethods ?? '[]') ?? [],
      stops: parseStringArray(trip.stops ?? '[]'),
      status: trip.status,
      createdAt: trip.createdAt.toISOString(),
    },
  });
};

export const updateTripController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const id = String(request.params.id);
  const trip = await prisma.trip.findFirst({
    where: { id, companyId },
  });

  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });

  const { depart, arrivee, station, time, date, duration, price, availableSeats, status, vehicleId, driverId, paymentMethods, stops } = request.body as {
    depart?: string;
    arrivee?: string;
    station?: string;
    time?: string;
    date?: string;
    duration?: string;
    price?: number;
    availableSeats?: number;
    status?: string;
    vehicleId?: string;
    driverId?: string;
    paymentMethods?: string[];
    stops?: string[];
  };

  const updateData: Record<string, unknown> = {};
  if (depart !== undefined) updateData.depart = depart;
  if (arrivee !== undefined) updateData.arrivee = arrivee;
  if (station !== undefined) updateData.station = station;
  if (time !== undefined) updateData.time = time;
  if (date !== undefined) updateData.date = new Date(date);
  if (duration !== undefined) updateData.duration = duration;
  if (price !== undefined) updateData.price = Number(price);
  if (availableSeats !== undefined) updateData.availableSeats = Number(availableSeats);
  if (status !== undefined) updateData.status = status;
  if (vehicleId !== undefined) updateData.vehicleId = vehicleId;
  if (driverId !== undefined) updateData.driverId = driverId;
  if (paymentMethods !== undefined) updateData.paymentMethods = JSON.stringify(paymentMethods ?? []);
  if (stops !== undefined) updateData.stops = JSON.stringify(stops ?? []);

  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: updateData,
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
      totalSeats: updated.availableSeats,
      vehicleId: updated.vehicleId,
      driverId: updated.driverId,
      paymentMethods: parsePaymentMethods(updated.paymentMethods ?? '[]') ?? [],
      stops: parseStringArray(updated.stops ?? '[]'),
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
    },
  });
};

export const deleteTripController = async (request: Request, response: Response) => {
  const companyId = request.authUser?.id;
  if (!companyId) return response.status(401).json({ message: 'Non authentifié.' });

  const id = String(request.params.id);
  const trip = await prisma.trip.findFirst({
    where: { id, companyId },
  });

  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });

  await prisma.trip.delete({ where: { id: trip.id } });
  return response.json({ message: 'Trajet supprimé.' });
};
