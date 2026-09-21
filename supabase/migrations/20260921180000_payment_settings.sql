-- Admin-configurable Mercado Pago credentials, stored as a singleton
-- row so /admin/settings/payments can save/replace them without a
-- redeploy. Only admins can read or write this table - checkout and
-- the webhook read it server-side via the service-role key (see
-- lib/paymentConfig.ts), which bypasses RLS entirely, same pattern as
-- subscriptions. env vars (MERCADOPAGO_ACCESS_TOKEN,
-- NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, MERCADOPAGO_WEBHOOK_SECRET)
-- remain the fallback when a column here is null.
create table if not exists public.payment_settings (
  id text primary key default 'mercadopago' check (id = 'mercadopago'),
  public_key text,
  access_token text,
  webhook_secret text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.payment_settings enable row level security;

create policy "admins can select payment settings"
  on public.payment_settings for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "admins can insert payment settings"
  on public.payment_settings for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "admins can update payment settings"
  on public.payment_settings for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
