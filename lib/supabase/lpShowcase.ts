import { supabase } from "@/lib/supabase/client";

// Admin-curated "Mostruário" items shown on the public landing page.
// Deliberately NOT a real prompts row: image + a short marketing title +
// an optional segment label the admin picks, nothing pulled from the
// catalog. /app remains the only place that ever shows a real prompt
// card, code, or prompt_text.
export interface LpShowcaseItem {
  id: string;
  image_url: string;
  title: string;
  segment: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase não configurado (env vars ausentes).");
  return supabase;
}

// Used by the public landing page: only active items, ordered for display.
export async function getActiveLpShowcaseItems(): Promise<LpShowcaseItem[]> {
  const { data, error } = await requireSupabase()
    .from("lp_showcase_items")
    .select("id, image_url, title, segment, position, is_active, created_at")
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}
