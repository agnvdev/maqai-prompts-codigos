-- Admin access: role flag on profiles, auto-provision profiles on signup,
-- and admin-only write access to the prompts catalog.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Auto-create a profile row whenever a new auth user signs up, so an
-- operator only has to flip is_admin=true afterwards to grant access.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admins can see and manage every prompt (including inactive ones);
-- the public "active prompts are viewable by everyone" policy still
-- applies for everyone else.
create policy "admins can select all prompts"
  on public.prompts for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "admins can insert prompts"
  on public.prompts for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "admins can update prompts"
  on public.prompts for update
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

create policy "admins can delete prompts"
  on public.prompts for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
