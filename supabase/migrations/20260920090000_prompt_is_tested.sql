-- Explicit "tested" signal per prompt, so the /app "Testado" badge only
-- ever reflects a real, admin-set indication in the database instead of
-- being inferred or guessed. Defaults to false, so no existing row is
-- retroactively (and falsely) marked as tested.
alter table public.prompts add column if not exists is_tested boolean not null default false;
