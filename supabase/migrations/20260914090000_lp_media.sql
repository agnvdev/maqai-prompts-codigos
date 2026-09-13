-- Landing page media library: admin-managed images consumed dynamically
-- by the public landing page (hero, segments, examples, before/after,
-- final CTA, logo/assets).
create table if not exists public.lp_media (
  id uuid primary key default gen_random_uuid(),
  slot text not null,
  identifier text not null,
  position int not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (slot, identifier)
);

create index if not exists lp_media_slot_idx on public.lp_media (slot, position);

alter table public.lp_media enable row level security;

drop policy if exists "active lp media is viewable by everyone" on public.lp_media;
create policy "active lp media is viewable by everyone"
  on public.lp_media for select
  using (is_active = true);

drop policy if exists "admins can select all lp media" on public.lp_media;
create policy "admins can select all lp media"
  on public.lp_media for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can insert lp media" on public.lp_media;
create policy "admins can insert lp media"
  on public.lp_media for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can update lp media" on public.lp_media;
create policy "admins can update lp media"
  on public.lp_media for update
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

drop policy if exists "admins can delete lp media" on public.lp_media;
create policy "admins can delete lp media"
  on public.lp_media for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Storage bucket for these assets, same public-read/admin-write shape
-- as prompt-images.
insert into storage.buckets (id, name, public)
values ('lp-media', 'lp-media', true)
on conflict (id) do nothing;

drop policy if exists "lp media files are publicly readable" on storage.objects;
create policy "lp media files are publicly readable"
  on storage.objects for select
  using (bucket_id = 'lp-media');

drop policy if exists "admins can upload lp media files" on storage.objects;
create policy "admins can upload lp media files"
  on storage.objects for insert
  with check (
    bucket_id = 'lp-media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can update lp media files" on storage.objects;
create policy "admins can update lp media files"
  on storage.objects for update
  using (
    bucket_id = 'lp-media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can delete lp media files" on storage.objects;
create policy "admins can delete lp media files"
  on storage.objects for delete
  using (
    bucket_id = 'lp-media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
