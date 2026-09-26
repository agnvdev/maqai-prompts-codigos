-- Permanent, unique catalog number per prompt, used to match uploaded
-- image files to prompts by filename (see "Upload por número" in
-- /admin/media). Existing prompts are numbered once here, in creation
-- order (oldest first); new prompts get the next number automatically
-- via the sequence-backed default. Numbers are never reassigned.

alter table public.prompts
  add column if not exists catalog_number integer;

-- One-time backfill, idempotent: only rows that don't have a number
-- yet are touched, so re-running this migration never renumbers an
-- already-numbered prompt.
with numbered as (
  select id, row_number() over (order by created_at asc, id asc) as rn
  from public.prompts
  where catalog_number is null
)
update public.prompts
set catalog_number = numbered.rn
from numbered
where prompts.id = numbered.id;

alter table public.prompts
  alter column catalog_number set not null;

alter table public.prompts
  drop constraint if exists prompts_catalog_number_key;
alter table public.prompts
  add constraint prompts_catalog_number_key unique (catalog_number);

create index if not exists prompts_catalog_number_idx on public.prompts (catalog_number);

-- New prompts get the next number automatically. The sequence starts
-- past the highest number already assigned above, so it never
-- collides with an existing (permanent) number.
create sequence if not exists public.prompts_catalog_number_seq;
select setval(
  'public.prompts_catalog_number_seq',
  (select coalesce(max(catalog_number), 0) from public.prompts),
  true
);
alter sequence public.prompts_catalog_number_seq owned by public.prompts.catalog_number;

alter table public.prompts
  alter column catalog_number set default nextval('public.prompts_catalog_number_seq');
