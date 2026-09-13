import { supabase } from "@/lib/supabase/client";

export const LP_MEDIA_SLOTS = [
  "hero",
  "before_after",
  "examples",
  "segments",
  "final_cta",
  "logo",
] as const;
export type LpMediaSlot = (typeof LP_MEDIA_SLOTS)[number];

export interface LpMediaRow {
  id: string;
  slot: string;
  identifier: string;
  position: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase não configurado (env vars ausentes).");
  return supabase;
}

// Used by the public landing page: only active rows, ordered for display.
export async function getActiveLpMedia(slot?: LpMediaSlot): Promise<LpMediaRow[]> {
  let query = requireSupabase()
    .from("lp_media")
    .select("id, slot, identifier, position, image_url, is_active, created_at")
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (slot) query = query.eq("slot", slot);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// slot -> { identifier -> image_url }, for quick lookup with a static fallback.
export async function getActiveLpMediaMap(slot: LpMediaSlot): Promise<Record<string, string>> {
  const rows = await getActiveLpMedia(slot);
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.image_url) map[row.identifier] = row.image_url;
  }
  return map;
}
