-- CRITICAL fix (Security Gate audit): "profiles are editable by owner"
-- (auth.uid() = id, from the very first migration) never restricted
-- WHICH columns an owner can change - any authenticated user could
-- call supabase.from("profiles").update({ is_admin: true }) on their
-- own row and grant themselves full /admin access. Verified live
-- against the project: the update succeeded before this fix. The
-- "profiles are insertable by owner" policy has the same gap for the
-- (normally unreachable, since handle_new_user() already creates the
-- row) case of a user re-inserting their own missing profile row.
--
-- RLS policies can't easily express "you can write this row but not
-- this one column" (WITH CHECK sees the new row, not a diff against
-- the old one), so this is enforced with a BEFORE INSERT OR UPDATE
-- trigger instead: a non-privileged actor changing/setting is_admin
-- has that column silently forced back to its safe value (OLD value on
-- UPDATE, false on INSERT) rather than the whole write erroring out -
-- editing full_name, signing up, etc. all keep working exactly as
-- before.
--
-- security definer + search_path pin, same pattern as handle_new_user()
-- in 20260913010000_admin_access.sql - needed so the admin-check
-- subquery can read auth.uid()'s own row regardless of the caller's
-- own RLS visibility.
--
-- auth.uid() IS NULL whenever the connection has no end-user JWT at
-- all - the Supabase Dashboard SQL editor, a migration, GoTrue's own
-- internal signup insert, or a service-role API call (its JWT has no
-- `sub` claim). That's exactly how is_admin is granted today (there is
-- no in-app "promote to admin" UI), so those contexts must stay able
-- to set it freely - actor_is_admin treats a null auth.uid() as
-- trusted. A real end-user's own browser session always carries a
-- non-null auth.uid() (their own id), so the attack this trigger
-- blocks - a logged-in customer self-granting is_admin through their
-- own session - can never produce a null auth.uid() to slip through.
create or replace function public.protect_is_admin_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean;
begin
  actor_is_admin := auth.uid() is null or exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  );

  if TG_OP = 'INSERT' then
    if not actor_is_admin and NEW.is_admin then
      NEW.is_admin := false;
    end if;
    return NEW;
  end if;

  if NEW.is_admin is distinct from OLD.is_admin and not actor_is_admin then
    NEW.is_admin := OLD.is_admin;
  end if;
  return NEW;
end;
$$;

drop trigger if exists protect_is_admin_column on public.profiles;
create trigger protect_is_admin_column
  before insert or update on public.profiles
  for each row execute function public.protect_is_admin_column();
