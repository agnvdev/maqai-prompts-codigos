-- Default fallback images for prompt cards, keyed by taxonomy axis
-- (category / segment / type) instead of per-prompt. Unlike lp_media,
-- multiple rows are allowed per (axis, value) on purpose — admins can
-- register a small pool of default images per category/segment/type so
-- cards in the same group don't all show the identical fallback photo;
-- the app picks one deterministically per prompt (see
-- lib/supabase/promptDefaults.ts).
create table if not exists public.prompt_default_images (
  id uuid primary key default gen_random_uuid(),
  axis text not null check (axis in ('category', 'segment', 'type')),
  value text not null,
  image_url text not null,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists prompt_default_images_axis_value_idx
  on public.prompt_default_images (axis, value, position);

alter table public.prompt_default_images enable row level security;

drop policy if exists "active prompt default images are viewable by everyone" on public.prompt_default_images;
create policy "active prompt default images are viewable by everyone"
  on public.prompt_default_images for select
  using (is_active = true);

drop policy if exists "admins can select all prompt default images" on public.prompt_default_images;
create policy "admins can select all prompt default images"
  on public.prompt_default_images for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can insert prompt default images" on public.prompt_default_images;
create policy "admins can insert prompt default images"
  on public.prompt_default_images for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can update prompt default images" on public.prompt_default_images;
create policy "admins can update prompt default images"
  on public.prompt_default_images for update
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

drop policy if exists "admins can delete prompt default images" on public.prompt_default_images;
create policy "admins can delete prompt default images"
  on public.prompt_default_images for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Reuses the existing prompt-images bucket (already public-read /
-- admin-write) instead of creating a new one — these are still prompt
-- card images, just scoped to a taxonomy value instead of a single row.
