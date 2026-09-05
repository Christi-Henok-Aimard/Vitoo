import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/passenger/auth.crypto.js';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (existing) {
    console.log('Admin déjà existant :', existing.email ?? existing.phone);
    return;
  }

  const passwordHash = await hashPassword('admin123');

  const admin = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'Vitoo',
      phone: '0700000000',
      email: 'admin@vitoo.com',
      city: 'Abidjan',
      role: 'admin',
      provider: 'password',
      passwordHash,
    },
  });

  console.log('Admin créé :', admin.email ?? admin.phone);
}

main()
  .catch((error) => {
    console.error('Erreur seed admin :', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
