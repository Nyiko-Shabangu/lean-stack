import Link from "next/link";

export default function Home() {
  return (
    <div className="landing-page-wrapper">
      {/* ── Nav ────────────────────────────────────── */}
      <nav>
        <Link href="#" className="nav-logo">lean-stack /</Link>
        <div className="nav-links">
          <Link href="#how-it-works" className="hide-mobile">how it works</Link>
          <Link href="#structure" className="hide-mobile">structure</Link>
          <Link href="#builds" className="hide-mobile">builds</Link>
          <a href="https://github.com/Nyiko-Shabangu/lean-stack" className="nav-cta">
            ↗ github
          </a>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <p className="hero-eyebrow fade-up">v1.0.0 — Next.js 15 Boilerplate</p>

          <h1 className="hero-title fade-up delay-1">
            Ship your<br />
            <span className="serif">next idea</span><br />
            in hours.
          </h1>

          <p className="hero-sub fade-up delay-2">
            Auth, AI (RAG), payments, email, and rate limiting — wired up, typed, and production-ready. Clone. Fill your env. Build.
          </p>

          <div className="hero-actions fade-up delay-3">
            <a href="https://github.com/Nyiko-Shabangu/lean-stack" className="btn-primary">
              ↗ clone the repo
            </a>
            <Link href="#how-it-works" className="btn-ghost">
              see how it works →
            </Link>
          </div>

          <div className="stack-row fade-up delay-4">
            <span className="pill accent">Next.js 15</span>
            <span className="pill">Clerk</span>
            <span className="pill">Supabase</span>
            <span className="pill">Claude</span>
            <span className="pill">Pinecone</span>
            <span className="pill">Stripe</span>
            <span className="pill">Redis</span>
            <span className="pill">SendGrid</span>
            <span className="pill">TypeScript</span>
            <span className="pill">Zod</span>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────── */}
      <section id="how-it-works">
        <div className="container">
          <p className="section-label"><span className="num">01</span> how to use it</p>

          <div className="two-col-narrow">
            <div>
              <p className="text-mono-subtle">
                This is not a tutorial project. It&apos;s a starting point for something real. Every file is production-ready — fix nothing, change what matters.
              </p>
              <div className="mt-2-5">
                <div className="big-stat">16</div>
                <p className="stat-label">files. zero placeholders.</p>
              </div>
            </div>

            <div className="steps">
              <div className="step">
                <span className="step-num">step_01</span>
                <div className="step-content">
                  <h3 className="step-title">Clone &amp; install</h3>
                  <p className="step-desc">Fork or clone the repo. Run the install command. You&apos;re already further than most people.</p>
                  <span className="step-code">git clone + npm install</span>
                </div>
              </div>
              <div className="step">
                <span className="step-num">step_02</span>
                <div className="step-content">
                  <h3 className="step-title">Fill your .env</h3>
                  <p className="step-desc">Copy <code className="text-accent">.env.local.example</code> and fill in every key. The app throws at startup if anything is missing — Zod catches it before your users do.</p>
                  <span className="step-code">cp .env.local.example .env.local</span>
                </div>
              </div>
              <div className="step">
                <span className="step-num">step_03</span>
                <div className="step-content">
                  <h3 className="step-title">Run the SQL schema</h3>
                  <p className="step-desc">Paste <code className="text-accent">scripts/schema.sql</code> into your Supabase SQL editor. Creates <code className="text-foreground">profiles</code>, <code className="text-foreground">documents</code>, RLS policies, indexes, and the <code className="text-foreground">updated_at</code> trigger.</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">step_04</span>
                <div className="step-content">
                  <h3 className="step-title">Register webhooks</h3>
                  <p className="step-desc">Point Clerk to <code className="text-accent">/api/webhooks/clerk</code> and Stripe to <code className="text-accent">/api/webhooks/stripe</code>. Copy the signing secrets into your env.</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">step_05</span>
                <div className="step-content">
                  <h3 className="step-title">Build your product</h3>
                  <p className="step-desc">The plumbing is done. Auth, AI, payments, email, rate limiting — it&apos;s all wired. Start in <code className="text-accent">app/dashboard/</code> and build what you actually care about.</p>
                  <span className="step-code">npm run dev</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Structure ──────────────────────────────── */}
      <section id="structure">
        <div className="container">
          <p className="section-label"><span className="num">02</span> project structure</p>

          <div className="two-col">
            <div className="file-tree">
              <div><span className="dir">lean-stack/</span></div>
              <div>├── <span className="dir">app/</span></div>
              <div>│&nbsp;&nbsp; ├── <span className="dir">api/</span></div>
              <div>│&nbsp;&nbsp; │&nbsp;&nbsp; ├── <span className="dir">ai/chat/</span></div>
              <div>│&nbsp;&nbsp; │&nbsp;&nbsp; │&nbsp;&nbsp; └── <span className="hl">route.ts</span> <span className="comment">← streaming RAG</span></div>
              <div>│&nbsp;&nbsp; │&nbsp;&nbsp; └── <span className="dir">webhooks/</span></div>
              <div>│&nbsp;&nbsp; │&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; ├── <span className="hl">clerk/route.ts</span></div>
              <div>│&nbsp;&nbsp; │&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; └── <span className="hl">stripe/route.ts</span></div>
              <div>│&nbsp;&nbsp; └── <span className="dir">dashboard/</span></div>
              <div>│&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; └── <span className="hl">useChat.ts</span> <span className="comment">← SSE hook</span></div>
              <div>├── <span className="dir">lib/</span></div>
              <div>│&nbsp;&nbsp; ├── <span className="hl">env.ts</span> <span className="comment">← Zod validation</span></div>
              <div>│&nbsp;&nbsp; ├── <span className="hl">redis.ts</span> <span className="comment">← atomic limiter</span></div>
              <div>│&nbsp;&nbsp; ├── <span className="hl">embeddings.ts</span></div>
              <div>│&nbsp;&nbsp; ├── <span className="hl">pinecone.ts</span></div>
              <div>│&nbsp;&nbsp; ├── <span className="hl">supabase.ts</span></div>
              <div>│&nbsp;&nbsp; ├── <span className="hl">stripe.ts</span></div>
              <div>│&nbsp;&nbsp; └── <span className="hl">sendgrid.ts</span></div>
              <div>├── <span className="dir">types/</span>index.ts</div>
              <div>├── <span className="hl">middleware.ts</span> <span className="comment">← auth + rate limit</span></div>
              <div>└── <span className="hl">scripts/schema.sql</span></div>
            </div>

            <div>
              <div className="terminal">
                <div><span className="comment"># Clone and run</span></div>
                <div><span className="prompt">$ </span><span className="cmd">git clone https://github.com/</span></div>
                <div><span className="cmd">&nbsp;&nbsp;YOUR_USERNAME/lean-stack</span></div>
                <div><span className="prompt">$ </span><span className="cmd">cd lean-stack</span></div>
                <div><span className="prompt">$ </span><span className="cmd">npm install</span></div>
                <div>&nbsp;</div>
                <div><span className="comment"># Set up env</span></div>
                <div><span className="prompt">$ </span><span className="cmd">cp .env.local.example .env.local</span></div>
                <div>&nbsp;</div>
                <div><span className="comment"># Dev server</span></div>
                <div><span className="prompt">$ </span><span className="cmd">npm run dev</span></div>
                <div>&nbsp;</div>
                <div><span className="out">▲ Next.js 15.0.0</span></div>
                <div><span className="out">- Local: http://localhost:3000</span></div>
                <div><span className="out">✓ Starting...</span></div>
                <div><span className="out">✓ Ready in 847ms</span></div>
              </div>

              <div className="mt-1-5 checklist">
                <div className="check-item done">
                  <div className="check-icon">✓</div>
                  <span>Atomic Redis rate limiter — no race conditions</span>
                </div>
                <div className="check-item done">
                  <div className="check-icon">✓</div>
                  <span>Real embeddings via OpenAI text-embedding-3-small</span>
                </div>
                <div className="check-item done">
                  <div className="check-icon">✓</div>
                  <span>Streaming SSE — users see responses as they generate</span>
                </div>
                <div className="check-item done">
                  <div className="check-icon">✓</div>
                  <span>Svix + Stripe signature verification on all webhooks</span>
                </div>
                <div className="check-item done">
                  <div className="check-icon">✓</div>
                  <span>Supabase RLS — users can only touch their own data</span>
                </div>
                <div className="check-item done">
                  <div className="check-icon">✓</div>
                  <span>Zod env validation — fails at startup, not in production</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Builds ─────────────────────────────────── */}
      <section id="builds">
        <div className="container">
          <p className="section-label"><span className="num">03</span> suggested builds</p>
          <p className="text-mono-subtle" style={{ maxWidth: "520px", marginBottom: "3rem" }}>
            This stack can support any of these out of the box. Each uses a different combination of the services already wired up.
          </p>

          <div className="builds">
            <div className="build-card">
              <div className="build-arrow">↗</div>
              <div className="build-tag hot"><span className="dot"></span>most common</div>
              <h3 className="build-title">AI Document Chat</h3>
              <p className="build-desc">Upload PDFs or docs. Users ask questions. Claude answers using only the document&apos;s content. Pinecone stores the chunks, RAG retrieves them.</p>
              <div className="build-features">
                <span className="build-feat">Pinecone</span>
                <span className="build-feat">Claude streaming</span>
                <span className="build-feat">Supabase docs table</span>
                <span className="build-feat">useChat hook</span>
              </div>
            </div>

            <div className="build-card">
              <div className="build-arrow">↗</div>
              <div className="build-tag"><span className="dot"></span>saas</div>
              <h3 className="build-title">SaaS Starter</h3>
              <p className="build-desc">Gated features behind a paywall. Free tier gets 20 AI calls/min. Pro unlocks more. Stripe handles the upgrade, webhooks update the DB.</p>
              <div className="build-features">
                <span className="build-feat">Stripe checkout</span>
                <span className="build-feat">Clerk auth</span>
                <span className="build-feat">subscription tiers</span>
                <span className="build-feat">billing portal</span>
              </div>
            </div>

            <div className="build-card">
              <div className="build-arrow">↗</div>
              <div className="build-tag"><span className="dot"></span>ai tool</div>
              <h3 className="build-title">AI Writing Assistant</h3>
              <p className="build-desc">Multi-turn conversations with context memory. Past messages stay in the conversation history passed to Claude on each request.</p>
              <div className="build-features">
                <span className="build-feat">multi-turn history</span>
                <span className="build-feat">streaming output</span>
                <span className="build-feat">rate limiting</span>
                <span className="build-feat">Redis cache</span>
              </div>
            </div>

            <div className="build-card">
              <div className="build-arrow">↗</div>
              <div className="build-tag"><span className="dot"></span>automation</div>
              <h3 className="build-title">Onboarding Email Flow</h3>
              <p className="build-desc">User signs up via Clerk. Webhook fires. Supabase row created. Welcome email sends via SendGrid within seconds — zero manual steps.</p>
              <div className="build-features">
                <span className="build-feat">Clerk webhook</span>
                <span className="build-feat">SendGrid</span>
                <span className="build-feat">Supabase profiles</span>
              </div>
            </div>

            <div className="build-card">
              <div className="build-arrow">↗</div>
              <div className="build-tag"><span className="dot"></span>search</div>
              <h3 className="build-title">Semantic Search Engine</h3>
              <p className="build-desc">Ingest a knowledge base into Pinecone. Users search with natural language. Results ranked by semantic similarity, not keyword matching.</p>
              <div className="build-features">
                <span className="build-feat">embeddings batch</span>
                <span className="build-feat">Pinecone query</span>
                <span className="build-feat">score threshold</span>
              </div>
            </div>

            <div className="build-card">
              <div className="build-arrow">↗</div>
              <div className="build-tag"><span className="dot"></span>api</div>
              <h3 className="build-title">Rate-Limited AI API</h3>
              <p className="build-desc">Expose your own AI endpoints with per-user, per-route rate limiting already in place. Return-headers let clients self-throttle.</p>
              <div className="build-features">
                <span className="build-feat">Redis Lua script</span>
                <span className="build-feat">RateLimit headers</span>
                <span className="build-feat">429 + Retry-After</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Deploy ─────────────────────────────────── */}
      <section id="deploy">
        <div className="container">
          <p className="section-label"><span className="num">04</span> before you deploy</p>

          <div className="two-col">
            <div>
              <p className="text-mono-subtle" style={{ marginBottom: "2rem" }}>Run through this before pushing to production. Most of it is one-time config.</p>
              <div className="flex-column-gap-0-75">
                <div className="status-pill">
                  <span className="label">Vercel</span>
                  <span className="value">add all env vars</span>
                </div>
                <div className="status-pill">
                  <span className="label">Supabase</span>
                  <span className="value">confirm RLS on all tables</span>
                </div>
                <div className="status-pill">
                  <span className="label">Stripe</span>
                  <span className="value">switch to live mode keys</span>
                </div>
                <div className="status-pill">
                  <span className="label">Clerk</span>
                  <span className="value">register production webhook URL</span>
                </div>
                <div className="status-pill">
                  <span className="label">Redis</span>
                  <span className="value">use Upstash, not localhost</span>
                </div>
                <div className="status-pill">
                  <span className="label">Cloudflare</span>
                  <span className="value">SSL → Full (Strict)</span>
                </div>
            </div>
          </div>

            <div>
              <p className="font-bold-tight">Run the integrity audit</p>
              <p className="description-subtle">
                The repo includes an AI agent prompt that audits every file — security, types, auth, rate limiting, webhooks, and schema. Paste it into Claude or Cursor before you ship.
              </p>
              <div className="terminal">
                <div><span className="comment"># Run type check + lint</span></div>
                <div><span className="prompt">$ </span><span className="cmd">npm run type-check</span></div>
                <div><span className="out">✓ No errors</span></div>
                <div>&nbsp;</div>
                <div><span className="prompt">$ </span><span className="cmd">npm run lint</span></div>
                <div><span className="out">✓ No warnings</span></div>
                <div>&nbsp;</div>
                <div><span className="comment"># Then paste INTEGRITY_AUDIT_PROMPT.md</span></div>
                <div><span className="comment"># into Claude with your codebase</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <div className="container">
        <footer>
          <span className="logo">lean-stack — MIT License</span>
          <div className="links">
            <a href="https://github.com/Nyiko-Shabangu/lean-stack">GitHub</a>
            <a href="https://github.com/Nyiko-Shabangu/lean-stack/blob/main/README.md">Docs</a>
            <a href="https://github.com/Nyiko-Shabangu/lean-stack/issues">Issues</a>
          </div>
        </footer>
      </div>
    </div>
  );
}