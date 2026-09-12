import { supabase } from "@/lib/supabase/client";
import type { FilterTag, Prompt, PromptCategory, PromptSegment, PromptType } from "@/lib/types";

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

export async function getCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, created_at")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getActivePrompts(): Promise<PromptRow[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select(
      "id, code, title, description, image_url, category_id, is_premium, is_active, created_at, prompt_text, segment, type, tools, tags, featured, categories(name)"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as PromptRow[];
}

export function toPrompt(row: PromptRow): Prompt {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description ?? "",
    category: (row.categories?.name ?? "Essenciais") as PromptCategory,
    segment: (row.segment ?? "Geral") as PromptSegment,
    type: (row.type ?? "Imagem") as PromptType,
    tools: row.tools ?? [],
    prompt: row.prompt_text ?? "",
    featured: row.featured,
    tags: (row.tags ?? []) as FilterTag[],
  };
}

export async function getCatalogPrompts(): Promise<Prompt[]> {
  const rows = await getActivePrompts();
  return rows.map(toPrompt);
}
