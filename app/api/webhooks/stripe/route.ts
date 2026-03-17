import { headers } from 'next/headers';
import { stripe, PLANS } from '@/lib/stripe';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSubscriptionConfirmation } from '@/lib/sendgrid';
import type { SubscriptionStatus } from '@/types';
import type Stripe from 'stripe';

// Map Stripe statuses to our DB enum
function mapStatus(status: Stripe.Subscription['status']): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
        active: 'active',
        trialing: 'trialing',
        past_due: 'past_due',
        canceled: 'canceled',
        incomplete: 'incomplete',
    };
    return map[status] ?? 'incomplete';
}

// Infer tier from the price ID on the subscription.
// Compares against the canonical PLANS constant — never does substring matching
// on Stripe price IDs (which look like price_1OQb4k... and don't contain tier names).
function getTierFromSubscription(sub: Stripe.Subscription): 'pro' | 'enterprise' | 'free' {
    const priceId = sub.items.data[0]?.price.id ?? '';

    const enterpriseIds = Object.values(PLANS.enterprise) as string[];
    const proIds        = Object.values(PLANS.pro)         as string[];

    if (enterpriseIds.includes(priceId)) return 'enterprise';
    if (proIds.includes(priceId))        return 'pro';
    return 'free';
}

export async function POST(req: Request) {
    // ─── Verify Stripe signature ──────────────────────────────────────────────
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
        return Response.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
        return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // ─── Handle events ────────────────────────────────────────────────────────

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;
                const customerId = sub.customer as string;
                const status = mapStatus(sub.status);
                const tier = getTierFromSubscription(sub);

                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('email, full_name')
                    .eq('stripe_customer_id', customerId)
                    .single();

                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({ subscription_status: status, subscription_tier: tier })
                    .eq('stripe_customer_id', customerId);

                if (error) {
                    console.error('[Stripe Webhook] Failed to update subscription:', error);
                    return Response.json({ error: 'DB update failed' }, { status: 500 });
                }

                // Send confirmation email only on new active subscriptions
                if (event.type === 'customer.subscription.created' && status === 'active' && profile?.email) {
                    await sendSubscriptionConfirmation(profile.email, tier).catch(err =>
                        console.error('[Stripe Webhook] Failed to send confirmation email:', err)
                    );
                }

                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;
                const customerId = sub.customer as string;

                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({ subscription_status: 'canceled', subscription_tier: 'free' })
                    .eq('stripe_customer_id', customerId);

                if (error) {
                    console.error('[Stripe Webhook] Failed to cancel subscription:', error);
                    return Response.json({ error: 'DB update failed' }, { status: 500 });
                }

                break;
            }

            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                // Link the Stripe customer ID back to the user profile.
                // The session object does NOT carry subscription_data.metadata on the
                // completed event — metadata lives on the subscription resource itself.
                if (session.customer && session.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(
                        session.subscription as string
                    );
                    const userId = subscription.metadata?.userId;

                    if (userId) {
                        const { error } = await supabaseAdmin
                            .from('profiles')
                            .update({ stripe_customer_id: session.customer as string })
                            .eq('clerk_id', userId);

                        if (error) {
                            console.error('[Stripe Webhook] Failed to link stripe_customer_id:', error);
                            return Response.json({ error: 'DB update failed' }, { status: 500 });
                        }
                    }
                }

                break;
            }

            default:
                break;
        }
    } catch (err) {
        console.error('[Stripe Webhook] Unhandled error:', err);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }

    return Response.json({ received: true });
}
