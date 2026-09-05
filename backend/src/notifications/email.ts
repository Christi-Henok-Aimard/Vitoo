import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'vitoo@resend.dev';
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'Vitoo';

const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export const emailProvider = resendClient ? 'resend' : 'demo';

if (emailProvider === 'demo') {
  process.stdout.write(
    [
      '',
      '╔════════════════════════════════════════════════════════════╗',
      '║  📧 VITOO EMAIL : MODE DÉMO ACTIVÉ                         ║',
      '║  Aucun fournisseur email configuré. Les messages seront    ║',
      '║  affichés dans la console. Configurez :                    ║',
      '║   • RESEND_API_KEY                                        ║',
      '║   • RESEND_FROM_EMAIL / RESEND_FROM_NAME (optionnel)      ║',
      '╚════════════════════════════════════════════════════════════╝',
      '',
    ].join('\n') + '\n',
  );
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: SendEmailOptions): Promise<void> => {
  if (resendClient) {
    try {
      const { data, error } = await resendClient.emails.send({
        from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });

      if (error) {
        process.stderr.write(`[Vitoo][Email·Resend] Échec vers ${to} : ${error.message}\n`);
        throw new Error(`Impossible d'envoyer l'email : ${error.message}`);
      }

      process.stdout.write(`[Vitoo][Email·Resend] Envoyé à ${to} (id: ${data?.id || 'n/a'})\n`);
      return;
    } catch (cause) {
      process.stderr.write(
        `[Vitoo][Email·Resend] Échec vers ${to} : ${cause instanceof Error ? cause.message : cause}\n`,
      );
      throw cause;
    }
  }

  // Mode démo
  process.stdout.write(`\n[Vitoo][Email-démo] → ${to}\n[Vitoo][Email-démo]   Sujet: ${subject}\n[Vitoo][Email-démo]   Corps:\n${text || html}\n\n`);
};
