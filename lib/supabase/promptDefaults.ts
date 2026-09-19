import { supabase } from "@/lib/supabase/client";
import type { Prompt } from "@/lib/types";

export const PROMPT_DEFAULT_AXES = ["category", "segment", "type"] as const;
export type PromptDefaultAxis = (typeof PROMPT_DEFAULT_AXES)[number];

export interface PromptDefaultImageRow {
  id: string;
  axis: PromptDefaultAxis;
  value: string;
  image_url: string;
  position: number;
  is_active: boolean;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase não configurado (env vars ausentes).");
  return supabase;
}

// Used by /app: only active rows, ordered for deterministic selection.
export async function getActivePromptDefaultImages(): Promise<PromptDefaultImageRow[]> {
  const { data, error } = await requireSupabase()
    .from("prompt_default_images")
    .select("id, axis, value, image_url, position, is_active, created_at")
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) throw error;
  return data as PromptDefaultImageRow[];
}

// "axis:value" -> ordered image_url pool, for O(1) lookup at render time.
export type PromptDefaultImagesMap = Record<string, string[]>;

export async function getPromptDefaultImagesMap(): Promise<PromptDefaultImagesMap> {
  const rows = await getActivePromptDefaultImages();
  const map: PromptDefaultImagesMap = {};
  for (const row of rows) {
    const key = `${row.axis}:${row.value}`;
    (map[key] ??= []).push(row.image_url);
  }
  return map;
}

// Small stable hash so a given prompt always resolves to the same pool
// image across renders/pages, instead of flickering between options.
function stableIndex(id: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

// Priority: prompt.image_url -> category default(s) -> segment default(s)
// -> type default(s) -> null (caller falls back to the TypeIcon placeholder).
export function resolvePromptImage(prompt: Prompt, map: PromptDefaultImagesMap): string | null {
  if (prompt.image_url) return prompt.image_url;

  const candidates: [PromptDefaultAxis, string][] = [
    ["category", prompt.category],
    ["segment", prompt.segment],
    ["type", prompt.type],
  ];

  for (const [axis, value] of candidates) {
    const pool = map[`${axis}:${value}`];
    if (pool && pool.length > 0) {
      return pool[stableIndex(prompt.id, pool.length)];
    }
  }

  return null;
}
