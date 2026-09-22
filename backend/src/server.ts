import { app } from './app.js';
import { prisma } from './lib/db.js';
import { hashPassword } from './auth/passenger/auth.crypto.js';

// En production, aligne le schéma SQLite avec schema.prisma au démarrage
// (équivalent d'un `prisma db push` manuel — indispensable sans shell Render).
// Désactivable avec PRISMA_AUTO_PUSH=off. Non bloquant en cas d'échec.
const autoPushSchema = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.PRISMA_AUTO_PUSH === 'off') return;
  try {
    const { execSync } = await import('node:child_process');
    execSync('npx --no-install prisma db push --skip-generate', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });
    console.log('[boot] Schéma Prisma synchronisé (db push).');
  } catch (error) {
    console.error('[boot] db push ignoré (non bloquant) :', error);
  }
};

const bootstrapAdmin = async (): Promise<void> => {
  const phone = process.env.ADMIN_BOOTSTRAP_PHONE?.trim();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!phone || !password) return;
  const existing = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (existing) return;
  await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'Vitoo',
      phone,
      city: '',
      role: 'admin',
      passwordHash: await hashPassword(password),
    },
  });
  console.log('[boot] Compte administrateur initial créé.');
};

const port = Number(process.env.PORT || 4000);

const start = async (): Promise<void> => {
  await autoPushSchema();
  await bootstrapAdmin();
  app.listen(port, '0.0.0.0', () => console.log(`Vitoo auth backend listening on http://0.0.0.0:${port}`));
};

start().catch((error) => {
  console.error('[boot] Impossible de démarrer le serveur:', error);
  process.exit(1);
});