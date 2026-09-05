import { Router, type NextFunction, type Request, type Response } from 'express';
import { prisma } from '../lib/db.js';
import { verifyJwt, type JwtPayload } from '../shared/middleware/jwt.js';

declare module 'express-serve-static-core' {
  interface Request {
    adminUser?: JwtPayload;
  }
}

export const adminRouter = Router();

const requireAdmin = (request: Request, response: Response, next: NextFunction) => {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return response.status(401).json({ message: 'Authentification requise.' });

  const payload = verifyJwt(token);
  if (!payload) return response.status(401).json({ message: 'Token invalide ou expiré.' });
  if (payload.role !== 'admin') return response.status(403).json({ message: 'Accès réservé aux administrateurs.' });

  request.adminUser = payload;
  return next();
};

const USER_ROLES = ['passenger', 'company', 'driver', 'admin'] as const;

type Role = (typeof USER_ROLES)[number];

const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);

const handlePrismaError = (error: unknown, response: Response) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2025'
  ) {
    return response.status(404).json({ message: 'Ressource introuvable.' });
  }
  console.error('[admin] Prisma error:', error);
  return response.status(500).json({ message: 'Erreur interne du serveur.' });
};

const parsePagination = (query: Record<string, unknown>) => {
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1);
  const limitRaw = Number.parseInt(String(query.limit ?? '50'), 10);
  const limit = Math.min(200, Math.max(1, Number.isNaN(limitRaw) ? 50 : limitRaw));
  return { page, limit, skip: (page - 1) * limit, take: limit };
};

const wrap = (handler: (request: Request, response: Response) => Promise<Response | void>) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await handler(request, response);
    } catch (error) {
      next(error);
    }
  };

adminRouter.get('/stats', requireAdmin, wrap(async (_request, response) => {
  const [users, companies, drivers, trips, bookings, tickets] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'company' } }),
    prisma.driver.count(),
    prisma.trip.count(),
    prisma.booking.count(),
    prisma.ticket.count(),
  ]);

  return response.json({
    users,
    companies,
    drivers,
    trips,
    bookings,
    tickets,
  });
}));

adminRouter.get('/users', requireAdmin, wrap(async (request, response) => {
  const { role } = request.query as Record<string, string | undefined>;
  const where = isRole(role) ? { role } : {};
  const { skip, take, page, limit } = parsePagination(request.query as Record<string, unknown>);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      city: true,
      role: true,
      provider: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
    }),
    prisma.user.count({ where }),
  ]);

  return response.json({ users, pagination: { page, limit, total } });
}));

adminRouter.get('/users/:id', requireAdmin, wrap(async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: String(request.params.id) },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      city: true,
      role: true,
      provider: true,
      googleId: true,
      avatarUrl: true,
      companyName: true,
      rccm: true,
      taxId: true,
      createdAt: true,
    },
  });

  if (!user) return response.status(404).json({ message: 'Utilisateur introuvable.' });
  return response.json({ user });
}));

adminRouter.patch('/users/:id', requireAdmin, wrap(async (request, response) => {
  const { role, companyName, rccm, taxId } = request.body as Record<string, unknown>;

  if (role !== undefined && !isRole(role)) {
    return response.status(400).json({ message: `Rôle invalide. Valeurs acceptées : ${USER_ROLES.join(', ')}.` });
  }

  const user = await prisma.user.update({
    where: { id: String(request.params.id) },
    data: {
      ...(role !== undefined ? { role } : {}),
      ...(companyName !== undefined ? { companyName: companyName as string | null } : {}),
      ...(rccm !== undefined ? { rccm: rccm as string | null } : {}),
      ...(taxId !== undefined ? { taxId: taxId as string | null } : {}),
    },
  }).catch((error: unknown) => handlePrismaError(error, response));

  if (!user) return undefined;

  return response.json({ user });
}));

adminRouter.delete('/users/:id', requireAdmin, wrap(async (request, response) => {
  if (request.adminUser && request.params.id === request.adminUser.sub) {
    return response.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
  }

  try {
    await prisma.user.delete({
      where: { id: String(request.params.id) },
    });
  } catch (error) {
    return handlePrismaError(error, response);
  }
  return response.json({ message: 'Utilisateur supprimé.' });
}));

adminRouter.get('/trips', requireAdmin, wrap(async (request, response) => {
  const { companyId, status } = request.query as Record<string, string | undefined>;
  const where: Record<string, unknown> = {};
  if (companyId) where.companyId = companyId;
  if (status) where.status = status;
  const { skip, take, page, limit } = parsePagination(request.query as Record<string, unknown>);

  const trips = await prisma.trip.findMany({
    where,
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          lastName: true,
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
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

  return response.json({ trips, pagination: { page, limit } });
}));

adminRouter.get('/bookings', requireAdmin, wrap(async (request, response) => {
  const { skip, take, page, limit } = parsePagination(request.query as Record<string, unknown>);
  const bookings = await prisma.booking.findMany({
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
      trip: {
        select: {
          id: true,
          depart: true,
          arrivee: true,
          time: true,
          price: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

  return response.json({ bookings, pagination: { page, limit } });
}));

adminRouter.get('/tickets', requireAdmin, wrap(async (request, response) => {
  const { skip, take, page, limit } = parsePagination(request.query as Record<string, unknown>);
  const tickets = await prisma.ticket.findMany({
    include: {
      trip: {
        select: {
          id: true,
          depart: true,
          arrivee: true,
          time: true,
        },
      },
      company: {
        select: {
          id: true,
          companyName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

  return response.json({ tickets, pagination: { page, limit } });
}));

export default adminRouter;
