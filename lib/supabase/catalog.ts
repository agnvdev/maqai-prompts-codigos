import { supabase } from "@/lib/supabase/client";
import type { FilterTag, Prompt, PromptCategory, PromptSegment, PromptType } from "@/lib/types";
import { DEFAULT_CATEGORY, DEFAULT_SEGMENT, DEFAULT_TYPE } from "@/lib/taxonomy";

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
  "id, code, title, description, image_url, category_id, is_premium, is_active, created_at, prompt_text, segment, type, tools, tags, featured, categories(name)";

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
  offset = 0,
  limit = DEFAULT_PAGE_SIZE,
}: {
  search?: string;
  filter?: string;
  offset?: number;
  limit?: number;
}): Promise<PromptPage> {
  let query = requireSupabase().from("prompts").select(PROMPT_COLUMNS).eq("is_active", true);

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

export async function getSectionPrompts({
  kind,
  offset = 0,
  limit = DEFAULT_SECTION_SIZE,
}: {
  kind: SectionKind;
  offset?: number;
  limit?: number;
}): Promise<PromptPage> {
  let query = requireSupabase().from("prompts").select(PROMPT_COLUMNS).eq("is_active", true);

  switch (kind) {
    case "comeceAqui": {
      const id = await getCategoryIdByName("Essenciais");
      query = id ? query.or(`category_id.is.null,category_id.eq.${id}`) : query.is("category_id", null);
      break;
    }
    case "maisUsados":
      query = query.eq("featured", true);
      break;
    case "codigosVirais":
      query = query.contains("tags", ["Códigos"]);
      break;
    case "maquinasPesadas":
      query = query.eq("segment", "Máquinas Pesadas");
      break;
    case "agro":
      query = query.eq("segment", "Agro");
      break;
    case "mineracao":
      query = query.eq("segment", "Mineração");
      break;
    case "combos": {
      const id = await getCategoryIdByName("Combos");
      if (!id) return { items: [], hasMore: false };
      query = query.eq("category_id", id);
      break;
    }
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data as unknown as PromptRow[];
  return { items: rows.map(toPrompt), hasMore: rows.length === limit };
}
