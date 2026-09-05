import africastalking from 'africastalking';
import twilio from 'twilio';

/**
 * Envoi SMS multi-fournisseurs, pensé pour l'Afrique de l'Ouest :
 *   1. Africa's Talking (recommandé pour CI/SN/BF/ML — couverture locale, tarifs locaux)
 *   2. Twilio (fallback international)
 *   3. Mode démo : le message est affiché dans la console du backend
 *
 * Variables .env :
 *   AFRICAS_TALKING_USERNAME / AFRICAS_TALKING_API_KEY / AFRICAS_TALKING_FROM (sender ID ou short code)
 *   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER
 */

const AT_USERNAME = process.env.AFRICAS_TALKING_USERNAME;
const AT_API_KEY = process.env.AFRICAS_TALKING_API_KEY;
const AT_FROM = process.env.AFRICAS_TALKING_FROM;

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER;

const atClient =
  AT_USERNAME && AT_API_KEY
    ? africastalking({ username: AT_USERNAME, apiKey: AT_API_KEY }).SMS
    : null;

const twilioClient =
  TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM
    ? twilio(TWILIO_SID, TWILIO_TOKEN)
    : null;

export const smsProvider = atClient ? "africastalking" : twilioClient ? "twilio" : "demo";

if (smsProvider === "demo") {
  process.stdout.write(
    [
      "",
      "╔════════════════════════════════════════════════════════════╗",
      "║  📱 VITOO SMS : MODE DÉMO ACTIVÉ                            ║",
      "║  Aucun fournisseur SMS configuré. Les messages seront       ║",
      "║  affichés dans la console. Configurez :                     ║",
      "║   • AFRICAS_TALKING_USERNAME / API_KEY / FROM (recommandé)  ║",
      "║   • ou TWILIO_ACCOUNT_SID / AUTH_TOKEN / FROM_NUMBER        ║",
      "╚════════════════════════════════════════════════════════════╝",
      "",
    ].join("\n") + "\n",
  );
}

export const sendSms = async (to: string, message: string): Promise<void> => {
  if (atClient) {
    try {
      const options = { to: [to], message } as Parameters<typeof atClient.send>[0];
      if (AT_FROM) (options as Record<string, unknown>).from = AT_FROM;
      await atClient.send(options);
      process.stdout.write(`[Vitoo][SMS·AT] Envoyé à ${to}\n`);
      return;
    } catch (cause) {
      process.stderr.write(
        `[Vitoo][SMS·AT] Échec vers ${to} : ${cause instanceof Error ? cause.message : cause} — tentative Twilio…\n`,
      );
      if (!twilioClient) throw cause;
    }
  }

  if (twilioClient) {
    try {
      await twilioClient.messages.create({ from: TWILIO_FROM, to, body: message });
      process.stdout.write(`[Vitoo][SMS·Twilio] Envoyé à ${to}\n`);
      return;
    } catch (cause) {
      process.stderr.write(
        `[Vitoo][SMS·Twilio] Échec vers ${to} : ${cause instanceof Error ? cause.message : cause}\n`,
      );
      throw new Error("Impossible d'envoyer le SMS.", { cause });
    }
  }

  // Mode démo
  process.stdout.write(`\n[Vitoo][SMS-démo] → ${to}\n[Vitoo][SMS-démo]   ${message}\n\n`);
};
