-- Dedicated Antes/Depois pairs for the landing page. The generic
-- lp_media table only ever stored one image per row, which couldn't
-- represent a real before/after comparison (a single "before_after" row
-- with identifier "Depois," already exists from that broken attempt -
-- left untouched below, still manageable from the legacy section of the
-- LP media admin UI). This table stores both images of a pair together,
-- so the LP can render real side-by-side comparisons.
create table if not exists public.lp_before_after_pairs (
  id uuid primary key default gen_random_uuid(),
  before_image_url text not null,
  after_image_url text not null,
  prompt_code text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists lp_before_after_pairs_position_idx
  on public.lp_before_after_pairs (position);

alter table public.lp_before_after_pairs enable row level security;

drop policy if exists "active before/after pairs are viewable by everyone" on public.lp_before_after_pairs;
create policy "active before/after pairs are viewable by everyone"
  on public.lp_before_after_pairs for select
  using (is_active = true);

drop policy if exists "admins can select all before/after pairs" on public.lp_before_after_pairs;
create policy "admins can select all before/after pairs"
  on public.lp_before_after_pairs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can insert before/after pairs" on public.lp_before_after_pairs;
create policy "admins can insert before/after pairs"
  on public.lp_before_after_pairs for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can update before/after pairs" on public.lp_before_after_pairs;
create policy "admins can update before/after pairs"
  on public.lp_before_after_pairs for update
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

drop policy if exists "admins can delete before/after pairs" on public.lp_before_after_pairs;
create policy "admins can delete before/after pairs"
  on public.lp_before_after_pairs for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Reuses the existing lp-media bucket (already public-read / admin-write)
-- instead of a new one - these are still landing-page marketing images.
