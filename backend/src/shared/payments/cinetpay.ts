import { createHmac } from 'node:crypto';

// Intégration CinetPay — API checkout (guichet hébergé).
// Base : https://api-checkout.cinetpay.com/v2/payment (création)
//       → /v2/check ou /v2/payment/check (vérification, appelées côté serveur).
// Toutes les interactions avec les clés se font côté backend uniquement.

const DEFAULT_BASE_URL = 'https://api-checkout.cinetpay.com';
const DEFAULT_CURRENCY = 'XOF';

export interface CinetpayConfig {
  apiKey: string;
  siteId: string;
  secretKey?: string;
  baseUrl: string;
}

export const getCinetpayConfig = (): CinetpayConfig => ({
  apiKey: process.env.CINETPAY_API_KEY || '',
  siteId: process.env.CINETPAY_SITE_ID || '',
  secretKey: process.env.CINETPAY_SECRET_KEY || undefined,
  baseUrl: process.env.CINETPAY_BASE_URL || DEFAULT_BASE_URL,
});

export const isCinetpayConfigured = (): boolean => {
  const { apiKey, siteId } = getCinetpayConfig();
  return Boolean(apiKey && siteId);
};

// URL publique de l'API (pour le webhook de notification CinetPay).
// À configurer côté hébergement : https://vitoo-api.onrender.com
export const publicApiUrl = (): string =>
  (process.env.PUBLIC_API_URL || process.env.CLIENT_ORIGIN || 'http://localhost:4000').replace(/\/$/, '');

// URL du site passager (pour le retour après paiement).
export const frontendUrl = (): string =>
  (process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');

export const notifyUrl = (): string => `${publicApiUrl()}/api/payments/webhook/cinetpay`;
export const returnUrl = (): string => `${frontendUrl()}/passenger/payment-return`;

export type CinetpayChannel = 'ALL' | 'MOBILE_MONEY' | 'CREDIT_CARD' | 'WALLET';

export interface CinetpayCheckoutInput {
  transactionId: string;
  amount: number;
  currency?: string;
  description: string;
  customerName: string;
  customerSurname: string;
  customerEmail?: string;
  customerPhone: string;
  channels: CinetpayChannel;
}

export interface CinetpayCheckoutResult {
  paymentToken: string;
  paymentUrl: string;
}

const readJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Réponse CinetPay illisible (${response.status}) : ${text.slice(0, 200)}`);
  }
};

const fetchBase = async (path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> => {
  const { baseUrl, apiKey, siteId } = getCinetpayConfig();
  if (!apiKey || !siteId) throw new Error('CinetPay n\'est pas configuré (CINETPAY_API_KEY / CINETPAY_SITE_ID).');

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ apikey: apiKey, site_id: siteId, ...body }),
  });
  if (!response.ok) {
    throw new Error(`CinetPay ${path} → HTTP ${response.status}`);
  }
  return readJson<Record<string, unknown>>(response);
};

const success = (payload: Record<string, unknown>): boolean => {
  const code = payload.code;
  if (typeof code === 'number') return code === 0 || code === 201;
  if (typeof code === 'string') return code === '0' || code === '201';
  return Boolean(payload.data && payload.payment_url);
};

// Crée le lien de paiement hébergé CinetPay.
export const createCinetpayCheckout = async (input: CinetpayCheckoutInput): Promise<CinetpayCheckoutResult> => {
  const payload = await fetchBase('/v2/payment', {
    transaction_id: input.transactionId,
    amount: input.amount,
    currency: input.currency || DEFAULT_CURRENCY,
    description: input.description.slice(0, 200),
    notify_url: notifyUrl(),
    return_url: returnUrl(),
    channels: input.channels,
    customer_id: input.transactionId.slice(-30),
    customer_name: input.customerSurname.slice(0, 255) || 'Passager',
    customer_surname: input.customerName.slice(0, 255) || 'Vitoo',
    customer_email: input.customerEmail || undefined,
    customer_phone: input.customerPhone,
    lang: 'FR',
    metadata: 'vitoo',
  });

  if (!success(payload)) {
    throw new Error(String(payload.message || 'CinetPay : création de paiement refusée.'));
  }
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const paymentUrl = (data.payment_url as string) || (payload.payment_url as string) || '';
  const token = (data.payment_token as string) || (payload.payment_token as string) || '';
  if (!paymentUrl) throw new Error('CinetPay : URL de paiement manquante dans la réponse.');
  return { paymentToken: token, paymentUrl };
};

export type CinetpayStatus = 'paid' | 'failed' | 'pending' | 'unknown';

export interface CinetpayCheckResult {
  status: CinetpayStatus;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  detail?: string;
}

const normalizeStatus = (field: unknown): string => String(field ?? '').toUpperCase();

const acceptedKeywords = ['ACCEPTED', 'SUCCESS', 'PAID', 'SUCCESSFUL', 'OK'];
const failedKeywords = ['REFUSED', 'FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'];

// Vérifie le statut canonique d'une transaction auprès de CinetPay.
// La vérification se fait toujours côté serveur (c'est elle qui fait foi).
export const checkCinetpayTransaction = async (transactionId: string): Promise<CinetpayCheckResult> => {
  const payload = await fetchBase('/v2/payment/check', { transaction_id: transactionId });
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const details = (data.details ?? {}) as Record<string, unknown>;

  const candidates = [data.status, details.status, data.cpm_trans_status, data.transaction_status, data.payment_status];
  const amountRaw = data.cpm_amount ?? data.amount ?? details.amount;
  const statusRaw = candidates.find((value) => normalizeStatus(value)) || '';

  let status: CinetpayStatus = 'pending';
  const norm = normalizeStatus(statusRaw);
  if (failedKeywords.some((k) => norm.includes(k))) status = 'failed';
  else if (acceptedKeywords.some((k) => norm.includes(k))) status = 'paid';
  else if (norm === 'PENDING' || norm === 'INITIATED' || norm === 'CREATED' || norm === '') status = 'pending';
  else status = 'unknown';

  return {
    status,
    amount: typeof amountRaw === 'number' ? amountRaw : parseInt(String(amountRaw ?? ''), 10) || undefined,
    currency: String(data.cpm_currency ?? details.currency ?? '').toUpperCase() || undefined,
    paymentMethod: String(data.cpm_payment_method ?? details.payment_method ?? '').trim() || undefined,
    detail: String(data.cpm_error_message ?? data.message ?? payload.message ?? '').slice(0, 200) || undefined,
  };
};

// Nom lisible du moyen de paiement utilisé (pour le billet / la réservation).
export const paymentMethodLabel = (channel?: string | null): string => {
  const raw = (channel || '').toUpperCase();
  if (!raw) return 'Paiement en ligne';
  if (raw.includes('WAVE')) return 'Wave';
  if (raw.includes('ORANGE') || raw === 'OM') return 'Orange Money';
  if (raw.includes('MOMO') || raw.includes('MTN')) return 'MTN MoMo';
  if (raw.includes('MOOV') || raw.includes('FLOOZ')) return 'Moov Money';
  if (raw.includes('CARD') || raw.includes('VISA') || raw.includes('MASTER')) return 'Carte bancaire (Visa/Mastercard)';
  return channel || 'Paiement en ligne';
};

// Canal CinetPay en fonction de la méthode choisie par le passager.
export const cinetpayChannelFor = (method: string): CinetpayChannel => {
  const raw = method.toLowerCase();
  if (raw.includes('carte') || raw.includes('visa') || raw.includes('mastercard') || raw.includes('bdf')) {
    return 'CREDIT_CARD';
  }
  return 'MOBILE_MONEY';
};

// Vérification HMAC-SHA256 du webhook de notification (si CINETPAY_SECRET_KEY
// est renseigné). CinetPay envoie la signature dans l'en-tête X-TOKEN, calculée
// sur la concaténation des valeurs POSTées (dans l'ordre).
export const isValidCinetpaySignature = (bodyValues: string[], token: string | undefined): boolean => {
  const { secretKey } = getCinetpayConfig();
  if (!secretKey) return true;
  if (!token) return false;
  const expected = createHmac('sha256', secretKey)
    .update(Buffer.from(bodyValues.join(''), 'utf8'))
    .digest('hex')
    .toUpperCase();
  return token.trim().toUpperCase() === expected;
};