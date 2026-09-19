import { unstable_rethrow } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LpMediaRow } from "@/lib/supabase/lpMedia";
import type { PromptDefaultImageRow } from "@/lib/supabase/promptDefaults";
import { LpMediaClient } from "@/components/admin/LpMediaClient";
import { PromptDefaultImagesClient } from "@/components/admin/PromptDefaultImagesClient";

export default async function AdminMediaPage() {
  let items: LpMediaRow[] = [];
  let promptDefaultItems: PromptDefaultImageRow[] = [];
  let loadError: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();

    const [lpMediaResult, promptDefaultsResult] = await Promise.all([
      supabase
        .from("lp_media")
        .select("id, slot, identifier, position, image_url, is_active, created_at")
        .order("slot", { ascending: true })
        .order("position", { ascending: true }),
      supabase
        .from("prompt_default_images")
        .select("id, axis, value, image_url, position, is_active, created_at")
        .order("axis", { ascending: true })
        .order("value", { ascending: true })
        .order("position", { ascending: true }),
    ]);

    if (lpMediaResult.error) throw lpMediaResult.error;
    if (promptDefaultsResult.error) throw promptDefaultsResult.error;

    items = lpMediaResult.data ?? [];
    promptDefaultItems = (promptDefaultsResult.data ?? []) as PromptDefaultImageRow[];
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load media for admin:", error);
    loadError = "Não foi possível carregar as mídias agora. Tente novamente em instantes.";
  }

  return (
    <>
      {loadError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {loadError}
        </p>
      )}
      <PromptDefaultImagesClient items={promptDefaultItems} />
      <hr className="border-border" />
      <LpMediaClient items={items} />
    </>
  );
}
