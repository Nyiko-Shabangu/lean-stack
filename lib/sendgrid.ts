import sgMail from '@sendgrid/mail';
import { env } from './env';

sgMail.setApiKey(env.SENDGRID_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; // plain text fallback — improves deliverability
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
  await sgMail.send({
    to,
    from: {
      email: env.EMAIL_FROM,
      name: 'Your App Name',
    },
    subject,
    html,
    text: text ?? html.replace(/<[^>]*>/g, ''), // strip tags if no plain text provided
  });
}

// ─── Common email templates ───────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Welcome!',
    html: `<p>Hi ${name}, thanks for signing up.</p>`,
    text: `Hi ${name}, thanks for signing up.`,
  });
}

export async function sendSubscriptionConfirmation(
  to: string,
  tier: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `You're now on the ${tier} plan`,
    html: `<p>Your subscription to <strong>${tier}</strong> is active.</p>`,
  });
}
