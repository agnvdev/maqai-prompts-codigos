-- Public bucket for prompt images uploaded from the admin area.
insert into storage.buckets (id, name, public)
values ('prompt-images', 'prompt-images', true)
on conflict (id) do nothing;

drop policy if exists "prompt images are publicly readable" on storage.objects;
create policy "prompt images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'prompt-images');

drop policy if exists "admins can upload prompt images" on storage.objects;
create policy "admins can upload prompt images"
  on storage.objects for insert
  with check (
    bucket_id = 'prompt-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can update prompt images" on storage.objects;
create policy "admins can update prompt images"
  on storage.objects for update
  using (
    bucket_id = 'prompt-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "admins can delete prompt images" on storage.objects;
create policy "admins can delete prompt images"
  on storage.objects for delete
  using (
    bucket_id = 'prompt-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
