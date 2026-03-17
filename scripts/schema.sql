-- ─── Run this in your Supabase SQL editor ─────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Profiles ──────────────────────────────────────────────────────────────────

create type subscription_status as enum (
  'active', 'trialing', 'past_due', 'canceled', 'incomplete'
);

create type subscription_tier as enum ('free', 'pro', 'enterprise');

create table public.profiles (
  id                   uuid primary key default gen_random_uuid(),
  clerk_id             text unique not null,
  email                text unique not null,
  full_name            text,
  avatar_url           text,
  stripe_customer_id   text unique,
  subscription_status  subscription_status,
  subscription_tier    subscription_tier not null default 'free',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure handle_updated_at();

-- ─── Documents ─────────────────────────────────────────────────────────────────

create table public.documents (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references public.profiles(id) on delete cascade,
  title                text not null,
  content              text,
  pinecone_namespace   text not null,  -- use document id as namespace in Pinecone
  created_at           timestamptz not null default now()
);

-- ─── Row Level Security ────────────────────────────────────────────────────────
--
-- These policies use (auth.jwt() ->> 'sub') to identify the caller.
-- This requires a Clerk JWT template configured in the Supabase dashboard
-- (Integration > Clerk) that maps the Clerk user ID to the JWT 'sub' claim.
-- See: https://clerk.com/docs/integrations/databases/supabase
--
-- The supabaseAdmin server client bypasses RLS (service role key).
-- The anon supabase client is used only for client-side, user-scoped reads.

alter table public.profiles  enable row level security;
alter table public.documents enable row level security;

-- Users can only read/write their own profile.
-- (auth.jwt() ->> 'sub') returns the Clerk user ID from the signed JWT.
create policy "profiles: owner access"
  on public.profiles
  for all
  using     (clerk_id = (auth.jwt() ->> 'sub'))
  with check (clerk_id = (auth.jwt() ->> 'sub'));

-- Users can only access their own documents.
create policy "documents: owner access"
  on public.documents
  for all
  using (owner_id = (
    select id from public.profiles
    where clerk_id = (auth.jwt() ->> 'sub')
  ))
  with check (owner_id = (
    select id from public.profiles
    where clerk_id = (auth.jwt() ->> 'sub')
  ));

-- ─── Indexes ───────────────────────────────────────────────────────────────────

create index idx_profiles_clerk_id           on public.profiles(clerk_id);
create index idx_profiles_stripe_customer_id on public.profiles(stripe_customer_id);
create index idx_documents_owner_id          on public.documents(owner_id);

-- ─── Documents: updated_at (W5 fix) ───────────────────────────────────────────

alter table public.documents
  add column updated_at timestamptz not null default now();

create trigger documents_updated_at
  before update on public.documents
  for each row execute procedure handle_updated_at();
