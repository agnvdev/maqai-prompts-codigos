-- The public landing page must never show a prompt code, prompt name,
-- or prompt_text (that's /app-only). lp_before_after_pairs.prompt_code
-- was designed before that rule and would have exposed exactly that, so
-- it's replaced with a plain marketing title instead. Additive: the old
-- column is left in place (unused, 0 rows currently reference it) so no
-- data is destroyed.
alter table public.lp_before_after_pairs add column if not exists title text;

-- "Mostruário" (Showcase): admin-curated results shown on the LP -
-- image + short title + optional segment label only. Deliberately NOT
-- linked to a real prompts row, so the LP never renders a real catalog
-- card (that's /app-only) - this is copy the admin writes, not data
-- pulled from a prompt.
create table if not exists public.lp_showcase_items (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text not null,
  segment text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists lp_showcase_items_position_idx
  on public.lp_showcase_items (position);

alter table public.lp_showcase_items enable row level security;

drop policy if exists "active showcase items are viewable by everyone" on public.lp_showcase_items;
create policy "active showcase items are viewable by everyone"
  on public.lp_showcase_items for select
  using (is_active = true);

drop policy if exists "admins can select all showcase items" on public.lp_showcase_items;
create policy "admins can select all showcase items"
  on public.lp_showcase_items for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can insert showcase items" on public.lp_showcase_items;
create policy "admins can insert showcase items"
  on public.lp_showcase_items for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can update showcase items" on public.lp_showcase_items;
create policy "admins can update showcase items"
  on public.lp_showcase_items for update
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

drop policy if exists "admins can delete showcase items" on public.lp_showcase_items;
create policy "admins can delete showcase items"
  on public.lp_showcase_items for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Reuses the existing lp-media bucket - still landing-page marketing images.
