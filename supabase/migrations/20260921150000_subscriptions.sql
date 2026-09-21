-- Minimal subscriptions table for Mercado Pago-backed plans. Only what
-- the checkout route, webhook and /app gate actually need - no plans
-- table (lib/plans.ts is the source of truth for the 2 fixed plans).
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('monthly', 'annual')),
  provider_subscription_id text not null unique,
  status text not null,
  amount numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

-- Read-only for the owner (the /app gate and the checkout/success page
-- both just need to know their own status). No insert/update/delete
-- policy is granted to regular users on purpose: every write comes from
-- the checkout route and the Mercado Pago webhook, both server-side
-- using the service-role key, which bypasses RLS entirely. A user must
-- never be able to set their own subscription to "authorized".
create policy "subscriptions are viewable by owner"
  on public.subscriptions for select
  using (auth.uid() = user_id);
