import { randomInt } from 'node:crypto';
import { prisma } from '../../lib/db.js';
import { tripsStore } from '../types/trips.store.js';
import { paymentMethodLabel } from './cinetpay.js';

export type PaymentProvider = 'cinetpay' | 'fake';

export interface CreatePaymentInput {
  tripId: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  amount: number;
  currency?: string;
  provider: PaymentProvider;
  transactionId: string;
  token?: string;
  paymentUrl?: string;
  channel?: string;
}

export const newTransactionId = (): string =>
  `VITOO${Date.now()}${randomInt(100000, 999999)}`;

export const paymentsStore = {
  async create(input: CreatePaymentInput) {
    return prisma.payment.create({
      data: {
        tripId: input.tripId,
        userId: input.userId || null,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        customerEmail: input.customerEmail?.trim() || null,
        amount: input.amount,
        currency: input.currency || 'XOF',
        provider: input.provider,
        transactionId: input.transactionId,
        token: input.token || null,
        paymentUrl: input.paymentUrl || null,
        channel: input.channel || null,
        status: 'pending',
      },
    });
  },

  async findById(id: string) {
    return prisma.payment.findUnique({ where: { id } });
  },

  async findByTransactionId(transactionId: string) {
    return prisma.payment.findUnique({ where: { transactionId } });
  },

  async update(id: string, data: {
    status?: 'pending' | 'paid' | 'failed' | 'cancelled';
    token?: string;
    paymentUrl?: string;
    channel?: string;
    bookingId?: string;
    errorMessage?: string;
  }) {
    return prisma.payment.update({
      where: { id },
      data: { ...data, errorMessage: data.errorMessage ?? undefined },
    });
  },

  async updateStatusIfPending(id: string, status: 'paid' | 'failed' | 'cancelled', channel?: string, bookingId?: string) {
    const result = await prisma.payment.updateMany({
      where: { id, status: 'pending' },
      data: { status, channel: channel ?? undefined, bookingId: bookingId ?? undefined },
    });
    return result.count > 0;
  },

  // Récupère la réservation liée à un paiement (avec trajet + billet), si elle existe.
  async findBookingByPaymentId(paymentId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId },
      include: { booking: { include: { ticket: true } } },
    });
    if (!payment?.booking) return undefined;
    const trip = await tripsStore.findTripById(payment.tripId);
    if (!trip) return undefined;
    const { ticket, ...bookingData } = payment.booking as unknown as Record<string, unknown>;
    return { booking: { ...bookingData, trip, ticket } };
  },

  // Finalise un paiement accepté : crée la réservation + le billet (décrémente
  // les places) puis lie le billet au paiement. Idempotent : une réservation
  // déjà créée est simplement renvoyée.
  async finalizePaidPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return { error: 'Paiement introuvable.' };
    if (payment.status !== 'pending') {
      const done = await this.findBookingByPaymentId(paymentId);
      return done ?? { error: 'Paiement non confirmé.' };
    }

    const result = await tripsStore.createBooking({
      tripId: payment.tripId,
      userId: payment.userId || '',
      passengerName: payment.customerName,
      passengerPhone: payment.customerPhone,
      passengerEmail: payment.customerEmail || undefined,
      seats: 1,
      paymentMethod: paymentMethodLabel(payment.channel),
      amount: payment.amount,
    });

    if ('error' in result) return { error: result.error };
    const resultAny = result as unknown as { id: string };
    await this.updateStatusIfPending(paymentId, 'paid', payment.channel || undefined, resultAny.id);

    const done = await this.findBookingByPaymentId(paymentId);
    return done ?? { error: 'Paiement finalisé mais réservation introuvable.' };
  },
};

export type PaymentRecord = Awaited<ReturnType<typeof paymentsStore.findById>>;