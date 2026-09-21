import { Router } from 'express';
import express from 'express';
import { tripsStore } from '../shared/types/trips.store.js';
import { prisma } from '../lib/db.js';
import { paymentsStore, newTransactionId } from '../shared/payments/payments.store.js';
import {
  cinetpayChannelFor,
  checkCinetpayTransaction,
  createCinetpayCheckout,
  frontendUrl,
  isCinetpayConfigured,
  isValidCinetpaySignature,
} from '../shared/payments/cinetpay.js';
import { verifyToken } from '../auth/passenger/auth.crypto.js';

export const paymentsRouter = Router();

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
    role: payload.role,
  };
};

// 1) Initier un paiement en ligne pour un trajet :
//    • crée un paiement "pending"
//    • chez CinetPay (si configuré) renvoie l'URL du guichet hébergé
//    • sinon (clés absentes) renvoie l'URL de retour Vitoo → confirmation "simulée"
paymentsRouter.post('/initiate', async (request, response) => {
  const user = getUserFromHeader(request.header('authorization'));
  const { tripId, passengerName, passengerPhone, passengerEmail, method } = request.body as {
    tripId?: string;
    passengerName?: string;
    passengerPhone?: string;
    passengerEmail?: string;
    method?: string;
  };

  if (!tripId) return response.status(400).json({ message: 'Trajet manquant.' });
  if (!passengerName?.trim()) return response.status(400).json({ message: 'Le nom du passager est obligatoire.' });
  if (!passengerPhone?.trim()) return response.status(400).json({ message: 'Le numéro de téléphone est obligatoire.' });

  const trip = await tripsStore.findTripById(tripId);
  if (!trip) return response.status(404).json({ message: 'Trajet introuvable.' });
  if (trip.availableSeats <= 0) return response.status(409).json({ message: 'Ce trajet est complet.' });

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

  const transactionId = newTransactionId();
  const channels = cinetpayChannelFor(method || 'mobile');
  const configured = isCinetpayConfigured();

  let provider: 'cinetpay' | 'fake' = configured ? 'cinetpay' : 'fake';
  let paymentToken: string | undefined;
  let paymentUrl: string | undefined;

  if (configured) {
    try {
      const checkout = await createCinetpayCheckout({
        transactionId,
        amount: trip.price,
        description: `Billet Vitoo ${trip.depart} → ${trip.arrivee}`,
        customerName: passengerName.trim().split(' ').slice(1).join(' ') || passengerName.trim(),
        customerSurname: passengerName.trim().split(' ')[0] || 'Passager',
        customerEmail: passengerEmail || undefined,
        customerPhone: passengerPhone.trim(),
        channels,
      });
      paymentToken = checkout.paymentToken;
      paymentUrl = checkout.paymentUrl;
    } catch (error) {
      console.warn('[paiement] Échec CinetPay, bascule en mode test local :', error);
      provider = 'fake';
      paymentToken = undefined;
    }
  }

  const payment = await paymentsStore.create({
    tripId: trip.id,
    userId,
    customerName: passengerName.trim(),
    customerPhone: passengerPhone.trim(),
    customerEmail: passengerEmail || undefined,
    amount: trip.price,
    provider,
    transactionId,
    token: paymentToken,
    channel: provider === 'fake' ? method?.trim() || undefined : undefined,
  });

  // En mode CinetPay réel, on redirige vers le guichet hébergé.
  // Sinon, on renvoie vers l'écran de retour Vitoo qui confirme le paiement simulé.
  const effectiveUrl = provider === 'cinetpay' && paymentUrl
    ? paymentUrl
    : `${frontendUrl()}/passenger/payment-return?paymentId=${payment.id}`;

  return response.status(201).json({
    paymentId: payment.id,
    paymentUrl: effectiveUrl,
    amount: payment.amount,
    currency: payment.currency,
    provider: payment.provider,
    status: payment.status,
  });
});

// 2) Statut d'un paiement (utilisé par l'écran de retour).
paymentsRouter.get('/:paymentId', async (request, response) => {
  const { paymentId } = request.params;
  const payment = await paymentsStore.findById(paymentId);
  if (!payment) return response.status(404).json({ message: 'Paiement introuvable.' });

  const done = await paymentsStore.findBookingByPaymentId(paymentId);
  return response.json({
    payment: {
      id: payment.id,
      status: payment.status,
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency,
      channel: payment.channel,
      errorMessage: payment.errorMessage,
    },
    booking: done?.booking || null,
  });
});

// 3) Confirmation après retour du guichet CinetPay (ou mode local) :
//    vérifie le statut canonique côté CinetPay puis finalise le billet.
paymentsRouter.post('/:paymentId/confirm', async (request, response) => {
  const { paymentId } = request.params;
  const payment = await paymentsStore.findById(paymentId);
  if (!payment) return response.status(404).json({ message: 'Paiement introuvable.' });

  if (payment.status === 'paid') {
    const done = await paymentsStore.findBookingByPaymentId(paymentId);
    if (done) return response.json({ status: 'paid', ...done });
    return response.json({ status: 'paid' });
  }

  // Mode sans clés CinetPay : validation du paiement simulé.
  if (payment.provider === 'fake' || !isCinetpayConfigured()) {
    const done = await paymentsStore.finalizePaidPayment(paymentId);
    if ('error' in done) return response.status(409).json({ message: done.error });
    return response.json({ status: 'paid', ...done });
  }

  try {
    const check = await checkCinetpayTransaction(payment.transactionId);
    if (check.status === 'paid') {
      // Ne poser QUE le canal avant finalisation : finalizePaidPayment attend un
      // statut "pending" pour créer la réservation puis passe à "paid" + bookingId.
      await paymentsStore.update(payment.id, { channel: check.paymentMethod || payment.channel || undefined });
      const done = await paymentsStore.finalizePaidPayment(paymentId);
      if ('error' in done) return response.status(409).json({ message: done.error });
      return response.json({ status: 'paid', ...done });
    }
    if (check.status === 'failed') {
      await paymentsStore.updateStatusIfPending(payment.id, 'failed', undefined);
      return response.json({ status: 'failed', message: check.detail || 'Paiement refusé.' });
    }
    return response.json({ status: 'pending' });
  } catch (error) {
    console.error('[paiement] Erreur de vérification :', error);
    return response.status(502).json({ message: 'Impossible de vérifier le paiement auprès de CinetPay.' });
  }
});

// 4) Webhook de notification CinetPay (IPN, appelé par CinetPay en POST).
//    Toujours répondre 200 pour arrêter les renvois, même en cas de doublon.
paymentsRouter.post(
  '/webhook/cinetpay',
  express.urlencoded({ extended: false }),
  async (request, response) => {
    try {
      const raw = (request.body ?? {}) as Record<string, unknown>;
      const transactionId = String(raw.cpm_trans_id || '');
      const rawSiteId = String(raw.cpm_site_id || '');
      const signature = String(request.headers['x-token'] || raw.signature || '');

      if (!transactionId) return response.status(200).json({ status: 'ignored' });

      const payment = await paymentsStore.findByTransactionId(transactionId);
      if (!payment || payment.status === 'paid' || payment.status === 'failed') {
        return response.status(200).json({ status: 'ignored' });
      }

      if (rawSiteId && process.env.CINETPAY_SITE_ID && rawSiteId !== process.env.CINETPAY_SITE_ID) {
        return response.status(200).json({ status: 'ignored' });
      }

      const bodyValues = Object.values(raw).map((value) => String(value ?? ''));
      if (!isValidCinetpaySignature(bodyValues, signature || undefined)) {
        return response.status(200).json({ status: 'ignored' });
      }

      const check = await checkCinetpayTransaction(transactionId);
      if (check.status === 'paid') {
        await paymentsStore.update(payment.id, { channel: check.paymentMethod || payment.channel || undefined });
        await paymentsStore.finalizePaidPayment(payment.id);
      } else if (check.status === 'failed') {
        await paymentsStore.updateStatusIfPending(payment.id, 'failed', undefined);
      }
      return response.status(200).json({ status: 'ok', state: check.status });
    } catch (error) {
      console.error('[paiement] Webhook CinetPay :', error);
      return response.status(200).json({ status: 'error' });
    }
  },
);