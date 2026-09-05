import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { authRouter } from './auth/passenger/auth.routes.js';
import { companyAuthRouter } from './auth/company/company.auth.routes.js';
import { companyRouter } from './company/company.routes.js';
import { adminRouter } from './admin/admin.routes.js';
import { tripsRouter } from './passenger/trips.routes.js';

import { driverAuthRouter } from './auth/driver/driver.auth.routes.js';
import { driverRouter } from './driver/driver.routes.js';

export const app = express();

// Origines autorisées (CORS) :
//   • Plusieurs domaines Vercel (site passager + site compagnie)
//   • CLIENT_ORIGIN (variable single-origin, pour compat)
//   • localhost en dev
const allowedOrigins = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const fallbackOrigin = process.env.CLIENT_ORIGIN || '';
if (fallbackOrigin && !allowedOrigins.includes(fallbackOrigin)) allowedOrigins.push(fallbackOrigin);

app.use(
  cors({
    origin(origin, callback) {
      // Pas d'origine (requêtes serveur/curl) ou origine autorisée → OK
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const isLocalhost =
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost) return callback(null, true);
      console.warn(`[cors] Origine refusée : ${origin}`);
      return callback(new Error('Origine non autorisée par CORS'));
    },
  }),
);
app.use(express.json());
app.get('/api/health', (_request, response) => response.json({ status: 'ok', service: 'vitoo-auth' }));
app.use('/api/auth', authRouter);
app.use('/api/company/auth', companyAuthRouter);
app.use('/api/company', companyRouter);
app.use('/api/admin', adminRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/driver/auth', driverAuthRouter);
app.use('/api/driver', driverRouter);

// Toute route /api non trouvée → 404 JSON (et non le fallback SPA).
app.use('/api', (_request, response) => response.status(404).json({ message: 'Route API introuvable.' }));

// Frontend construit (Vite) : un seul conteneur sert l'API et le SPA.
const frontendDir = process.env.FRONTEND_DIR || path.resolve(process.cwd(), 'public');
const indexHtml = path.join(frontendDir, 'index.html');
if (existsSync(indexHtml)) {
  app.use(express.static(frontendDir));
  app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
    if (request.method !== 'GET' || request.path.startsWith('/api/')) return next();
    response.sendFile(indexHtml);
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error('[api] Unhandled error:', error);
  if (!response.headersSent) {
    response.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

