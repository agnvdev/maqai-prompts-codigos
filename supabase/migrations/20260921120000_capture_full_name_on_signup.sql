-- handle_new_user() only ever inserted `id`, silently dropping any
-- raw_user_meta_data passed to auth.signUp() (e.g. the customer's name
-- from /cadastro). Additive fix: same trigger, same profiles table
-- (full_name already exists, no new column), just also read the
-- metadata when present. Re-creating the function (not the trigger,
-- which is untouched) is the standard, idempotent way to change its
-- body.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
