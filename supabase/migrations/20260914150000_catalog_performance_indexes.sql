-- /app is designed to page through a catalog of 10k+ prompts, filtering
-- and searching purely with indexed, bounded (LIMIT/OFFSET) queries — no
-- query in lib/supabase/catalog.ts selects the whole table. These indexes
-- back every one of those query shapes.

-- Primary listing predicate ("show active prompts, newest first") used by
-- every section and the search/filter grid.
create index if not exists prompts_active_created_idx
  on public.prompts (is_active, created_at desc);

-- Individual columns used as equality filters (segment/type for sections
-- and, indirectly, the "Máquinas/Agro/Mineração" tabs; category_id already
-- has prompts_category_id_idx from the initial catalog migration; code
-- already has an implicit unique index from its UNIQUE constraint).
create index if not exists prompts_segment_idx on public.prompts (segment);
create index if not exists prompts_type_idx on public.prompts (type);
create index if not exists prompts_featured_idx on public.prompts (featured) where featured = true;

-- Tag-array filter (FilterChips values, and the "Códigos virais" section)
-- uses `tags @> ARRAY[...]`, which a GIN index on the array serves well.
create index if not exists prompts_tags_gin_idx on public.prompts using gin (tags);

-- Fast partial-text search (title/description/prompt_text ILIKE '%term%')
-- at catalog scale needs trigram indexes — a plain btree can't serve a
-- leading-wildcard match.
create extension if not exists pg_trgm;

create index if not exists prompts_title_trgm_idx
  on public.prompts using gin (title gin_trgm_ops);
create index if not exists prompts_description_trgm_idx
  on public.prompts using gin (description gin_trgm_ops);
create index if not exists prompts_prompt_text_trgm_idx
  on public.prompts using gin (prompt_text gin_trgm_ops);
create index if not exists prompts_code_trgm_idx
  on public.prompts using gin (code gin_trgm_ops);
