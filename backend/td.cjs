const BASE = 'http://localhost:4000/api';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(path, opts = {}) {
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch(BASE + path, {
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
        ...opts,
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
  const login = await req('/auth/login', { method: 'POST', body: JSON.stringify({ phone: '0722222222', password: 'chauffeur123' }) });
  const driverToken = login.token;
  const H = { Authorization: `Bearer ${driverToken}` };

  const me = await req('/auth/me', { headers: H });
  const dash = await req('/driver/trips', { headers: H });
  const tripId = dash.trips[0].id;
  const detail1 = await req(`/driver/trips/${tripId}`, { headers: H });

  const code1 = detail1.tickets[0].code;
  const code2 = detail1.tickets[1].code;
  console.log('DEBUG codes:', code1, code2, '| ticket0 keys:', Object.keys(detail1.tickets[0]).join(','));

  const look1 = await req('/driver/tickets/lookup', { method: 'POST', headers: H, body: JSON.stringify({ ticketId: code1 }) });
  const look2 = await req('/driver/tickets/lookup', { method: 'POST', headers: H, body: JSON.stringify({ ticketId: code2 }) });

  const val1 = await req('/driver/tickets/validate', { method: 'POST', headers: H, body: JSON.stringify({ ticketId: code1 }) });
  const val2 = await req('/driver/tickets/validate', { method: 'POST', headers: H, body: JSON.stringify({ ticketId: code2 }) });

  const look1After = await req('/driver/tickets/lookup', { method: 'POST', headers: H, body: JSON.stringify({ ticketId: code1 }) }).catch((e) => ({ _err: e.message }));
  const duplicateValidate = await req('/driver/tickets/validate', { method: 'POST', headers: H, body: JSON.stringify({ ticketId: code1 }) }).catch((e) => ({ _err: e.message }));

  const detail2 = await req(`/driver/trips/${tripId}`, { headers: H });
  const allUsed = detail2.tickets.every((t) => t.status === 'used');

  const start = await req(`/driver/trips/${tripId}/status`, { method: 'PATCH', headers: H, body: JSON.stringify({ status: 'in_transit' }) });

  const detail3 = await req(`/driver/trips/${tripId}`, { headers: H });
  const driverStatus = await req('/driver/trips', { headers: H }).then(() => null).catch(() => null);

  console.log(JSON.stringify({
    meRole: me.user.role,
    driverSpace: me.driverSpace ? 'PRESENTE' : 'ABSENTE',
    trip: { id: tripId, route: `${dash.trips[0].depart}->${dash.trips[0].arrivee}`, price: dash.trips[0].price, date: dash.trips[0].date, time: dash.trips[0].time },
    lookupBefore: look1.ticket.status,
    lookupDetails: look1.ticket.passengerName,
    tripSummaryInLookup: look1.trip?.depart + '->' + look1.trip?.arrivee,
    val1: val1.ticket.status,
    val2: val2.ticket.status,
    look1After: look1After.ticket ? look1After.ticket.status : look1After._err,
    duplicateValidate: duplicateValidate.ticket ? duplicateValidate.ticket.status : (duplicateValidate._err ? '409 deja utilise OK' : '?'),
    allUsedAfterCheckin: allUsed,
    tripStatusAfterStart: detail3.trip.status,
    driverRow: detail3.trip.driver ? `${detail3.trip.driver.firstName} ${detail3.trip.driver.lastName}` : 'n/a',
  }, null, 2));
})().catch((e) => console.error('ERR', e.message));