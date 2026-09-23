import { supabase } from "@/lib/supabase/client";
import type { FilterTag, Prompt, PromptCategory, PromptSegment, PromptType } from "@/lib/types";
import { DEFAULT_CATEGORY, DEFAULT_SEGMENT, DEFAULT_TYPE, TYPES } from "@/lib/taxonomy";

export interface AdminPromptRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prompt_text: string | null;
  segment: string | null;
  type: string | null;
  tools: string[];
  tags: string[];
  featured: boolean;
  is_premium: boolean;
  is_tested: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  created_at: string;
}

export interface PromptRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  is_premium: boolean;
  is_tested: boolean;
  is_active: boolean;
  created_at: string;
  prompt_text: string | null;
  segment: string | null;
  type: string | null;
  tools: string[];
  tags: string[];
  featured: boolean;
  categories: { name: string } | null;
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase não configurado (env vars ausentes).");
  return supabase;
}

const PROMPT_COLUMNS =
  "id, code, title, description, image_url, category_id, is_premium, is_tested, is_active, created_at, prompt_text, segment, type, tools, tags, featured, categories(name)";

export async function getCategories(): Promise<CategoryRow[]> {
  const { data, error } = await requireSupabase()
    .from("categories")
    .select("id, name, created_at")
    .order("name");

  if (error) throw error;
  return data;
}

export function toPrompt(row: PromptRow): Prompt {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description ?? "",
    category: (row.categories?.name ?? DEFAULT_CATEGORY) as PromptCategory,
    segment: (row.segment ?? DEFAULT_SEGMENT) as PromptSegment,
    type: (row.type ?? DEFAULT_TYPE) as PromptType,
    image_url: row.image_url,
    tools: row.tools ?? [],
    prompt: row.prompt_text ?? "",
    featured: row.featured,
    tags: (row.tags ?? []) as FilterTag[],
    is_premium: row.is_premium,
    is_tested: row.is_tested,
    created_at: row.created_at,
  };
}

export interface PromptPage {
  items: Prompt[];
  hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 24;
const DEFAULT_SECTION_SIZE = 20;

// Catalog is designed for tens of thousands of rows: every read here is
// bounded (range/limit) and filtered by an indexed column (see
// supabase/migrations for the is_active/segment/type/category_id/trigram
// indexes) — nothing in this module ever selects the whole table.
export async function getPromptsPage({
  search,
  filter,
  type,
  offset = 0,
  limit = DEFAULT_PAGE_SIZE,
}: {
  search?: string;
  filter?: string;
  // Required in practice on /app (every tab has an active type), but kept
  // optional here so callers that genuinely want the untyped catalog
  // (there are none today, but nothing in this module should force one)
  // aren't blocked from omitting it.
  type?: PromptType;
  offset?: number;
  limit?: number;
}): Promise<PromptPage> {
  let query = requireSupabase().from("prompts").select(PROMPT_COLUMNS).eq("is_active", true);

  if (type) query = query.eq("type", type);

  const trimmed = search?.trim();
  if (trimmed) {
    const like = `%${trimmed.replace(/[%,]/g, "")}%`;
    query = query.or(`title.ilike.${like},description.ilike.${like},code.ilike.${like},prompt_text.ilike.${like}`);
  }

  if (filter && filter !== "Todos" && filter !== "Favoritos") {
    query = query.contains("tags", [filter]);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data as unknown as PromptRow[];
  return { items: rows.map(toPrompt), hasMore: rows.length === limit };
}

// Same predicates as getPromptsPage (is_active + optional type/search/tag),
// just counted instead of fetched — one indexed count query, no rows pulled.
export async function getPromptsCount({
  search,
  filter,
  type,
}: {
  search?: string;
  filter?: string;
  type?: PromptType;
} = {}): Promise<number> {
  let query = requireSupabase()
    .from("prompts")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (type) query = query.eq("type", type);

  const trimmed = search?.trim();
  if (trimmed) {
    const like = `%${trimmed.replace(/[%,]/g, "")}%`;
    query = query.or(`title.ilike.${like},description.ilike.${like},code.ilike.${like},prompt_text.ilike.${like}`);
  }

  if (filter && filter !== "Todos" && filter !== "Favoritos") {
    query = query.contains("tags", [filter]);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getPromptsByIds(ids: string[]): Promise<Prompt[]> {
  if (ids.length === 0) return [];

  const { data, error } = await requireSupabase()
    .from("prompts")
    .select(PROMPT_COLUMNS)
    .eq("is_active", true)
    .in("id", ids);

  if (error) throw error;

  const rows = data as unknown as PromptRow[];
  const byId = new Map(rows.map((row) => [row.id, toPrompt(row)]));
  // Preserve caller order (e.g. most-recent-first).
  return ids.map((id) => byId.get(id)).filter((p): p is Prompt => Boolean(p));
}

export type SectionKind =
  | "comeceAqui"
  | "maisUsados"
  | "codigosVirais"
  | "maquinasPesadas"
  | "agro"
  | "mineracao"
  | "combos";

async function getCategoryIdByName(name: string): Promise<string | null> {
  const { data, error } = await requireSupabase()
    .from("categories")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

// Shared by getSectionPrompts and getSectionCount so the "which rows
// belong to this section" predicate is defined once.
//
// Split into an async lookup (resolveSectionScope) and a sync apply
// (applySectionScope) on purpose: a postgrest query builder is itself
// thenable, so returning one *through* an async function's return/await
// makes JS auto-resolve it right there (running the query immediately,
// before `.order()`/`.range()` get applied). Keeping applySectionScope
// synchronous avoids that trap.
type SectionScope =
  | { type: "categoryIdOrNull"; categoryId: string | null }
  | { type: "featured" }
  | { type: "tagContains"; tag: string }
  | { type: "segment"; segment: string }
  | { type: "categoryId"; categoryId: string }
  | { type: "none" }; // no rows can match (e.g. category not created yet)

async function resolveSectionScope(kind: SectionKind): Promise<SectionScope> {
  switch (kind) {
    case "comeceAqui":
      return { type: "categoryIdOrNull", categoryId: await getCategoryIdByName("Essenciais") };
    case "maisUsados":
      return { type: "featured" };
    case "codigosVirais":
      return { type: "tagContains", tag: "Códigos" };
    case "maquinasPesadas":
      return { type: "segment", segment: "Máquinas Pesadas" };
    case "agro":
      return { type: "segment", segment: "Agro" };
    case "mineracao":
      return { type: "segment", segment: "Mineração" };
    case "combos": {
      const id = await getCategoryIdByName("Combos");
      return id ? { type: "categoryId", categoryId: id } : { type: "none" };
    }
  }
}

interface SectionFilterable<Q> {
  eq: (column: string, value: unknown) => Q;
  or: (filters: string) => Q;
  is: (column: string, value: null) => Q;
  contains: (column: string, value: unknown) => Q;
}

function applySectionScope<Q>(query: Q, scope: SectionScope): Q | null {
  // The postgrest builder's real type has overloaded, narrower signatures
  // for these methods (e.g. `contains` accepts specific value shapes, not
  // `unknown`), which TS won't structurally match against a generic `Q`.
  // The cast below is the single place that bridges that gap; every
  // caller still gets back its own concrete `Q` (or null), unchanged.
  const q = query as unknown as SectionFilterable<Q>;

  switch (scope.type) {
    case "categoryIdOrNull":
      return scope.categoryId
        ? q.or(`category_id.is.null,category_id.eq.${scope.categoryId}`)
        : q.is("category_id", null);
    case "featured":
      return q.eq("featured", true);
    case "tagContains":
      return q.contains("tags", [scope.tag]);
    case "segment":
      return q.eq("segment", scope.segment);
    case "categoryId":
      return q.eq("category_id", scope.categoryId);
    case "none":
      return null;
  }
}

// Applied on top of applySectionScope's result so every section query
// (and its count) is AND-ed with the active tab's type - a section can
// never mix types across a tab switch. Same generic-cast trick as
// applySectionScope, for the same reason.
function applyTypeScope<Q>(query: Q, type: PromptType | undefined): Q {
  if (!type) return query;
  const q = query as unknown as SectionFilterable<Q>;
  return q.eq("type", type);
}

export async function getSectionPrompts({
  kind,
  type,
  offset = 0,
  limit = DEFAULT_SECTION_SIZE,
}: {
  kind: SectionKind;
  type?: PromptType;
  offset?: number;
  limit?: number;
}): Promise<PromptPage> {
  const scope = await resolveSectionScope(kind);
  const base = requireSupabase().from("prompts").select(PROMPT_COLUMNS).eq("is_active", true);
  const scoped = applySectionScope(base, scope);
  if (!scoped) return { items: [], hasMore: false };

  const { data, error } = await applyTypeScope(scoped, type)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;

  const rows = data as unknown as PromptRow[];
  return { items: rows.map(toPrompt), hasMore: rows.length === limit };
}

// Real per-category total (not "loaded so far") — one indexed count
// query per section, same predicate as getSectionPrompts.
export async function getSectionCount(kind: SectionKind, type?: PromptType): Promise<number> {
  const scope = await resolveSectionScope(kind);
  const base = requireSupabase().from("prompts").select("id", { count: "exact", head: true }).eq("is_active", true);
  const scoped = applySectionScope(base, scope);
  if (!scoped) return 0;

  const { count, error } = await applyTypeScope(scoped, type);
  if (error) throw error;
  return count ?? 0;
}

// One real count per type (Imagem/Vídeo/Texto) - powers the 3 main tab
// labels ("Imagens (302)", "Vídeos (133)", "Textos e códigos (77)").
// Same is_active predicate as everything else here, 3 small indexed
// count queries in parallel, never a row pulled.
export async function getTypeCounts(): Promise<Record<PromptType, number>> {
  const counts = await Promise.all(TYPES.map((type) => getPromptsCount({ type })));
  return Object.fromEntries(TYPES.map((type, i) => [type, counts[i]])) as Record<PromptType, number>;
}
