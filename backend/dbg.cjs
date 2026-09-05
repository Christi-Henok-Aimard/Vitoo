const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const t = await p.ticket.findFirst({
    where: { code: 'TKT-32179777' },
    include: { trip: true, booking: { include: { user: true } } },
  });
  console.log('ticket found:', !!t);
  if (t) {
    console.log('trip driverId:', t.trip.driverId);
    console.log('trip depart/arrivee:', t.trip.depart, t.trip.arrivee);
    console.log('booking:', t.booking ? 'yes' : 'null');
  }
  const driver = await p.driver.findFirst({ where: { user: { phone: '0722222222' } } });
  console.log('driver id:', driver && driver.id, '| userId:', driver && driver.userId, '| companyId:', driver && driver.companyId);
  await p.$disconnect();
})().catch((e) => { console.error('DB FAIL', e.message); process.exit(1); });