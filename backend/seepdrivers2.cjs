const BASE = 'http://localhost:4000/api';

async function call(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${JSON.stringify(body)}`);
  return body;
}

(async () => {
  const token = await (async () => {
    const login = await call('/company/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'compagnie.test@vitoo.ci', password: 'password123' }),
    });
    return login.token;
  })();

  const headers = { Authorization: `Bearer ${token}` };

  const driver = await call('/company/drivers', {
    method: 'POST',
    headers,
    body: JSON.stringify({ firstName: 'Kouassi', lastName: 'Koffi', phone: '0722222222', licenseNumber: 'PERM-999',  }),
  });

  const vehicle = await call('/company/vehicles', {
    method: 'POST',
    headers,
    body: JSON.stringify({ plate: '1234-TEST', brand: 'Toyota', model: 'Hiace', capacity: 10 }),
  });

  const trip = await call('/company/trips', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      depart: 'Abidjan',
      arrivee: 'Bouaké',
      station: 'Gare Adjamé',
      date: '2026-09-12',
      time: '08:00',
      price: 5000,
      totalSeats: 10,
      vehicleId: vehicle.vehicle.id,
      driverId: driver.driver.id,
      duration: '6h',
    }),
  });

  const t1 = await call('/company/tickets', {
    method: 'POST',
    headers,
    body: JSON.stringify({ tripId: trip.trip.id, passengerName: 'Awa Traoré', passengerPhone: '0733333333', paymentMethod: 'Wave', soldBy: 'counter' }),
  });
  const t2 = await call('/company/tickets', {
    method: 'POST',
    headers,
    body: JSON.stringify({ tripId: trip.trip.id, passengerName: 'Ibrahim Diabaté', passengerPhone: '0744444444', paymentMethod: 'Espèces', soldBy: 'counter' }),
  });

  console.log(JSON.stringify({
    companyToken: token,
    driver: { phone: '0722222222', password: 'chauffeur123', name: 'Kouassi Koffi', id: driver.driver.id },
    vehicleId: vehicle.vehicle.id,
    tripId: trip.trip.id,
    tickets: [
      { code: t1.ticket.code, passengerName: 'Awa Traoré' },
      { code: t2.ticket.code, passengerName: 'Ibrahim Diabaté' },
    ],
  }, null, 2));
})().catch((e) => { console.error(e.message); process.exit(1); });