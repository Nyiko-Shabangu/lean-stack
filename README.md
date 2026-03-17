# 🧱 Lean Plate

> Production-ready Next.js 15 boilerplate — Auth, AI (RAG), Payments, Email, and Rate Limiting wired up and ready to ship.

[![CI](https://github.com/Nyiko-Shabangu/lean-stack/actions/workflows/ci.yml/badge.svg)](https://github.com/Nyiko-Shabangu/lean-stack/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

<img width="1903" height="909" alt="image" src="https://github.com/user-attachments/assets/f72e7365-61f8-4cc4-8af2-6602b9b0c740" />

---

## What's included

| Layer | Service | Why |
|---|---|---|
| Framework | Next.js 15 App Router | File-based routing, server components, edge runtime |
| Auth | Clerk | Drop-in auth with webhooks that sync to your DB |
| Database | Supabase (Postgres) | Managed Postgres with Row Level Security |
| Cache / Rate Limiting | Redis (ioredis) | Atomic Lua-script rate limiter — no race conditions |
| AI | Anthropic Claude | Streaming responses via SSE |
| Embeddings | OpenAI text-embedding-3-small | Cheap, accurate, 1536-dim vectors |
| Vector DB | Pinecone | Namespace-scoped RAG per document |
| Payments | Stripe | Checkout + Billing Portal + full subscription lifecycle |
| Email | SendGrid | Transactional email with plain-text fallback |
| Env Validation | Zod | App throws at startup if any env var is missing |

---

## Architecture

```
Browser
  │
  ├─── Clerk (Auth)
  │       └── Webhook ──► /api/webhooks/clerk ──► Supabase profiles table
  │
  ├─── /api/ai/chat (POST)
  │       ├── Pinecone  (semantic search → top-K context chunks)
  │       └── Claude    (streaming SSE response)
  │
  └─── /api/webhooks/stripe
          └── Subscription events ──► Supabase subscription_status / tier

Middleware (every request)
  ├── Clerk: protect non-public routes
  └── Redis: atomic rate limit (per user, per route type)
      ├── /api/ai/*     → 20 req / min
      └── everything else → 120 req / min
```

---

## Project structure

```
├── app/
│   ├── api/
│   │   ├── ai/chat/route.ts          # Streaming RAG endpoint
│   │   └── webhooks/
│   │       ├── clerk/route.ts        # User sync → Supabase
│   │       └── stripe/route.ts       # Subscription lifecycle
│   └── dashboard/
│       └── useChat.ts                # Client streaming hook
├── lib/
│   ├── env.ts                        # Zod env validation (fails fast)
│   ├── supabase.ts                   # Browser + admin clients
│   ├── redis.ts                      # Atomic rate limiter
│   ├── embeddings.ts                 # Single + batch embed
│   ├── pinecone.ts                   # Upsert / query / delete helpers
│   ├── sendgrid.ts                   # Email helpers + templates
│   └── stripe.ts                     # Customer, checkout, portal helpers
├── types/index.ts                    # Shared TypeScript types
├── scripts/schema.sql                # Supabase schema + RLS policies
├── middleware.ts                     # Auth + rate limiting
└── .env.local.example
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account
- A [Supabase](https://supabase.com) project
- A [Redis](https://upstash.com) instance (Upstash recommended for serverless)
- An [Anthropic](https://console.anthropic.com) API key
- An [OpenAI](https://platform.openai.com) API key (embeddings only)
- A [Pinecone](https://pinecone.io) account
- A [Stripe](https://stripe.com) account
- A [SendGrid](https://sendgrid.com) account

### 1. Clone and install

```bash
git clone https://github.com/Nyiko-Shabangu/lean-stack.git
cd lean-stack
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
# Fill in every value — the app will throw on startup if any are missing
```

### 3. Set up the database

Run `scripts/schema.sql` in your Supabase SQL editor. This creates the `profiles` and `documents` tables with RLS policies and indexes.

### 4. Create your Pinecone index

In the Pinecone console, create an index named to match `PINECONE_INDEX` with:
- **Dimensions:** 1536
- **Metric:** cosine

### 5. Register webhooks

**Clerk** — Dashboard → Webhooks → Add endpoint:
```
https://yourdomain.com/api/webhooks/clerk
```
Subscribe to: `user.created`, `user.updated`, `user.deleted`

**Stripe** — Dashboard → Webhooks → Add endpoint:
```
https://yourdomain.com/api/webhooks/stripe
```
Subscribe to: `checkout.session.completed`, `customer.subscription.*`

### 6. Update Stripe Price IDs

In `lib/stripe.ts`, replace the placeholder `price_REPLACE_WITH_STRIPE_PRICE_ID` values with your actual Stripe Price IDs.

### 7. Run locally

```bash
npm run dev
```

---

## RAG pipeline

### Ingest a document

```typescript
import { upsertChunks } from '@/lib/pinecone';

// Split your document into chunks (500–1000 tokens each)
await upsertChunks(document.id, [
  { id: `${document.id}-0`, text: 'chunk text...', metadata: { page: 1 } },
  { id: `${document.id}-1`, text: 'more text...',  metadata: { page: 2 } },
]);
```

### Chat with a document

```typescript
const res = await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'Summarize the key points.',
    documentId: doc.id,
  }),
});
```

### Use the streaming hook

```tsx
import { useChat } from '@/app/dashboard/useChat';

export default function Chat({ documentId }: { documentId: string }) {
  const { messages, isStreaming, sendMessage } = useChat({ documentId });

  return (
    <div>
      {messages.map((m, i) => (
        <p key={i}><strong>{m.role}:</strong> {m.content}</p>
      ))}
      {isStreaming && <span>...</span>}
      <button onClick={() => sendMessage('What is this about?')}>Ask</button>
    </div>
  );
}
```

### Delete a document's vectors

```typescript
import { deleteNamespace } from '@/lib/pinecone';
await deleteNamespace(document.id);
```

---

## Rate limiting

Two independent buckets per user, using an atomic Redis Lua script (no race conditions):

| Route | Limit |
|---|---|
| `/api/ai/*` | 20 req / min |
| All other routes | 120 req / min |

Rate limit headers are returned on every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Deployment checklist

| Service | Action |
|---|---|
| **Vercel** | Add all env vars from `.env.local.example` |
| **Cloudflare** | SSL → Full (Strict), proxy the Vercel CNAME |
| **Supabase** | Confirm RLS is enabled on all tables |
| **Stripe** | Switch to live mode keys before launch |
| **Clerk** | Register your production webhook URL |
| **Sentry** | `npx @sentry/wizard -i nextjs` |
| **Redis** | Use Upstash or Redis Cloud — not localhost |

---

## Contributing

Pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](./LICENSE).
