import { app } from './app.js';
import { prisma } from './lib/db.js';
import { hashPassword } from './auth/passenger/auth.crypto.js';

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
  await bootstrapAdmin();
  app.listen(port, '0.0.0.0', () => console.log(`Vitoo auth backend listening on http://0.0.0.0:${port}`));
};

start().catch((error) => {
  console.error('[boot] Impossible de démarrer le serveur:', error);
  process.exit(1);
});