const BASE = 'http://localhost:4000/api';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(path, token, body) {
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch(BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) return json;
      if (i === 7) throw new Error(`${path} -> ${res.status} ${JSON.stringify(json)}`);
    } catch (e) {
      if (i === 7) throw e;
    }
    await sleep(1500);
  }
}

(async () => {
  const login = await post('/company/auth/login', null, { email: 'compagnie.test@vitoo.ci', password: 'password123' });
  const token = login.token;

  const driver = await post('/company/drivers', token, {
    firstName: 'Kouassi', lastName: 'Koffi', phone: '0722222222', licenseNumber: 'PERM-999', password: 'chauffeur123',
  }).catch(() => ({ driver: { id: 'cmtnrbwfg0009f2rwlxxcdauk' } }));

  const vehicle = await post('/company/vehicles', token, {
    plate: '1234-TEST', brand: 'Toyota', model: 'Hiace', capacity: 10,
  }).catch(() => ({ vehicle: { id: 'cmtnrcpd8000af2rwcj28bxi8' } }));

  const trip = await post('/company/trips', token, {
    depart: 'Abidjan', arrivee: 'Bouake', station: 'Gare Adjame',
    date: '2026-09-12', time: '08:00', price: 5000, totalSeats: 10,
    vehicleId: vehicle.vehicle?.id || vehicle.id, driverId: driver.driver?.id || driver.id, duration: '6h',
  });

  const t1 = await post('/company/tickets', token, {
    tripId: trip.trip.id, passengerName: 'Awa Traore', passengerPhone: '0733333333', paymentMethod: 'Wave', soldBy: 'counter',
  });
  const t2 = await post('/company/tickets', token, {
    tripId: trip.trip.id, passengerName: 'Ibrahim Diabate', passengerPhone: '0744444444', paymentMethod: 'Especes', soldBy: 'counter',
  });

  console.log(JSON.stringify({
    companyToken: token,
    driverPhone: '0722222222',
    driverPassword: 'chauffeur123',
    tripId: trip.trip.id,
    tickets: [
      { code: t1.ticket.code, name: 'Awa Traore', seat: t1.ticket.seatNumber },
      { code: t2.ticket.code, name: 'Ibrahim Diabate', seat: t2.ticket.seatNumber },
    ],
  }, null, 2));
})().catch((e) => console.error('ERR', e.message));