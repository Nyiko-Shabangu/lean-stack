import Stripe from 'stripe';
import { env } from './env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// ─── Price IDs — set these in your Stripe Dashboard, then copy here ───────────

export const PLANS = {
  pro: {
    monthly: 'price_REPLACE_WITH_STRIPE_PRICE_ID',
    annual:  'price_REPLACE_WITH_STRIPE_PRICE_ID',
  },
  enterprise: {
    monthly: 'price_REPLACE_WITH_STRIPE_PRICE_ID',
    annual:  'price_REPLACE_WITH_STRIPE_PRICE_ID',
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get or create a Stripe customer for a user.
 * Always call this before creating a checkout session.
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  existingStripeId?: string | null
): Promise<string> {
  if (existingStripeId) return existingStripeId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for a subscription.
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: {
      metadata: { userId },
    },
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL. Verify the session mode is \'subscription\'.');
  }
  return session.url;
}

/**
 * Create a Stripe Billing Portal session so users can manage their subscription.
 */
export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return session.url;
}
