import { Router } from 'express';
import { verifyToken } from '../auth/passenger/auth.crypto.js';
import type { AuthUser } from '../auth/passenger/auth.types.js';
import { tripsStore } from '../shared/types/trips.store.js';
import type { PaymentMethod } from '../shared/types/trips.types.js';
import { prisma } from '../lib/db.js';

export const tripsRouter = Router();

const getUserFromHeader = (header?: string) => {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = token ? verifyToken(token) : undefined;
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
    createdAt: new Date().toISOString(),
  } as AuthUser;
};

// Liste des compagnies disponibles
tripsRouter.get('/companies', async (_request, response) => {
  response.json({ companies: await tripsStore.listCompanies() });
});

// Villes disponibles (départs et arrivées des trajets réels)
tripsRouter.get('/cities', async (_request, response) => {
  try {
    const trips = await prisma.trip.findMany({
      select: { depart: true, arrivee: true },
      where: { status: { in: ['scheduled', 'boarding', 'in_transit'] } },
    });
    const cities = Array.from(new Set([...trips.map((t) => t.depart), ...trips.map((t) => t.arrivee)]))
      .map((city) => city.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'fr'));
    return response.json({ cities });
  } catch (error) {
    return response.status(500).json({ message: 'Impossible de charger les villes.' });
  }
});

// Recherche de trajets : /api/trips?depart=Abidjan&arrivee=Bouaké&company=UTB Express
tripsRouter.get('/', async (request, response) => {
  const { depart, arrivee, date, company } = request.query as Record<string, string | undefined>;
  response.json({ trips: await tripsStore.findTrips({ depart, arrivee, date, company }) });
});

// Réservation + paiement (simulé) : décrémente les places, renvoie le billet
tripsRouter.post('/:id/bookings', async (request, response) => {
  const user = getUserFromHeader(request.header('authorization'));
  const { passengerName, passengerPhone, seatNumber, paymentMethod } = request.body as {
    passengerName?: string;
    passengerPhone?: string;
    seatNumber?: string;
    paymentMethod?: PaymentMethod;
  };

  if (!passengerName?.trim()) return response.status(400).json({ message: 'Le nom du passager est obligatoire.' });
  if (!passengerPhone?.trim()) return response.status(400).json({ message: 'Le numéro de téléphone est obligatoire.' });
  if (!paymentMethod) return response.status(400).json({ message: 'Choisissez un moyen de paiement.' });

  const trip = await tripsStore.findTripById(request.params.id);
  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });
  if (!trip.paymentMethods.includes(paymentMethod)) {
    return response.status(400).json({ message: `Moyen de paiement non accepté par ${trip.company}.` });
  }

  const seat = seatNumber?.trim() || undefined;

  let userId = user?.id;
  if (!userId) {
    const guest = await prisma.user.upsert({
      where: { phone: passengerPhone.trim() },
      update: {},
      create: {
        firstName: passengerName.trim().split(' ')[0] || 'Passager',
        lastName: passengerName.trim().split(' ').slice(1).join(' ') || '',
        phone: passengerPhone.trim(),
        role: 'passenger',
        provider: 'password',
      },
    });
    userId = guest.id;
  }

  const result = await tripsStore.createBooking({
    tripId: trip.id,
    userId,
    passengerName: passengerName.trim(),
    passengerPhone: passengerPhone.trim(),
    passengerEmail: user?.email,
    seats: 1,
    seatNumber: seat,
    paymentMethod,
    amount: trip.price,
  });

  if ('error' in result) return response.status(409).json({ message: result.error });
  const resultAny = result as unknown as Record<string, unknown>;
  const { ticket, ...bookingData } = resultAny;
  return response.status(201).json({ booking: { ...bookingData, trip, ticket }, message: 'Paiement confirmé. Votre billet est disponible.' });
});

// Mes réservations (authentifié)
tripsRouter.get('/bookings/mine', async (request, response) => {
  const user = getUserFromHeader(request.header('authorization'));
  if (!user) return response.status(401).json({ message: 'Authentification requise.' });
  return response.json({ bookings: await tripsStore.listBookingsForUser(user.id) });
});

// Noter un trajet (authentifié)
tripsRouter.post('/:id/rating', async (request, response) => {
  const user = getUserFromHeader(request.header('authorization'));
  if (!user) return response.status(401).json({ message: 'Authentification requise.' });

  const { stars, comment } = request.body as { stars?: number; comment?: string };
  if (typeof stars !== 'number') return response.status(400).json({ message: 'La note est obligatoire.' });

  const result = await tripsStore.rateTrip({ tripId: String(request.params.id), userId: user.id, stars, comment });
  if ('error' in result) return response.status(400).json({ message: result.error });
  return response.status(201).json({ rating: result.rating, message: 'Merci pour votre avis !' });
});

// Détail d'un trajet
tripsRouter.get('/:id', async (request, response) => {
  const trip = await tripsStore.findTripById(String(request.params.id));
  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });
  return response.json({ trip });
});

// Arrivée à destination : marque la réservation comme terminée
tripsRouter.post('/bookings/:id/complete', async (request, response) => {
  const user = getUserFromHeader(request.header('authorization'));
  if (!user) return response.status(401).json({ message: 'Authentification requise.' });
  const booking = await tripsStore.completeBooking(request.params.id, user.id);
  if (!booking) return response.status(404).json({ message: 'Réservation introuvable.' });
  return response.json({ booking, message: 'Trajet terminé. Merci de voyager avec Vitoo !' });
});
