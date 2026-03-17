import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { Webhook } from 'svix';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/sendgrid';

export async function POST(req: Request) {
    // ─── Verify Svix signature ────────────────────────────────────────────────
    const headerPayload = await headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
        return Response.json({ error: 'Missing svix headers' }, { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    let event: WebhookEvent;

    try {
        event = wh.verify(body, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        }) as WebhookEvent;
    } catch {
        return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // ─── Handle events ────────────────────────────────────────────────────────

    switch (event.type) {
        case 'user.created': {
            const { id, email_addresses, first_name, last_name, image_url } = event.data;
            const email = email_addresses[0]?.email_address ?? '';
            const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

            const { error } = await supabaseAdmin.from('profiles').insert({
                clerk_id: id,
                email,
                full_name: fullName,
                avatar_url: image_url ?? null,
                stripe_customer_id: null,
                subscription_status: null,
                subscription_tier: 'free',
            });

            if (error) {
                console.error('[Clerk Webhook] Failed to create profile:', error);
                return Response.json({ error: 'DB insert failed' }, { status: 500 });
            }

            if (email) {
                await sendWelcomeEmail(email, fullName ?? 'there').catch(err =>
                    console.error('[Clerk Webhook] Failed to send welcome email:', err)
                );
            }

            break;
        }

        case 'user.updated': {
            const { id, email_addresses, first_name, last_name, image_url } = event.data;
            const email = email_addresses[0]?.email_address ?? '';
            const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ email, full_name: fullName, avatar_url: image_url ?? null })
                .eq('clerk_id', id);

            if (error) {
                console.error('[Clerk Webhook] Failed to update profile:', error);
                return Response.json({ error: 'DB update failed' }, { status: 500 });
            }

            break;
        }

        case 'user.deleted': {
            const { id } = event.data;

            if (!id) {
                return Response.json({ error: 'Missing user id' }, { status: 400 });
            }

            const { error } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('clerk_id', id);

            if (error) {
                console.error('[Clerk Webhook] Failed to delete profile:', error);
                return Response.json({ error: 'DB delete failed' }, { status: 500 });
            }

            break;
        }

        default:
            // Unhandled event types — return 200 so Clerk doesn't retry
            break;
    }

    return Response.json({ received: true });
}
