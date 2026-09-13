import { unstable_rethrow } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LpMediaRow } from "@/lib/supabase/lpMedia";
import { LpMediaClient } from "@/components/admin/LpMediaClient";

export default async function AdminMediaPage() {
  let items: LpMediaRow[] = [];
  let loadError: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("lp_media")
      .select("id, slot, identifier, position, image_url, is_active, created_at")
      .order("slot", { ascending: true })
      .order("position", { ascending: true });

    if (error) throw error;
    items = data ?? [];
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load LP media for admin:", error);
    loadError = "Não foi possível carregar as mídias agora. Tente novamente em instantes.";
  }

  return (
    <>
      {loadError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {loadError}
        </p>
      )}
      <LpMediaClient items={items} />
    </>
  );
}
