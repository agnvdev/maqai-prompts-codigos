import { supabase } from "@/lib/supabase/client";

export interface LpBeforeAfterPair {
  id: string;
  before_image_url: string;
  after_image_url: string;
  // A plain marketing title, never a prompt code/name - the public LP
  // must never reveal catalog internals (see lib/supabase/lpShowcase.ts
  // for the same rule applied to the showcase).
  title: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase não configurado (env vars ausentes).");
  return supabase;
}

// Used by the public landing page: only active pairs, ordered for display.
export async function getActiveLpBeforeAfterPairs(): Promise<LpBeforeAfterPair[]> {
  const { data, error } = await requireSupabase()
    .from("lp_before_after_pairs")
    .select("id, before_image_url, after_image_url, title, position, is_active, created_at")
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}
