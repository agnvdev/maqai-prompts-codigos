import { unstable_rethrow } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LpMediaRow } from "@/lib/supabase/lpMedia";
import type { PromptDefaultImageRow } from "@/lib/supabase/promptDefaults";
import type { LpBeforeAfterPair } from "@/lib/supabase/lpBeforeAfter";
import { PromptDefaultImagesClient } from "@/components/admin/PromptDefaultImagesClient";
import { LpBeforeAfterClient } from "@/components/admin/LpBeforeAfterClient";
import { LpImagesClient } from "@/components/admin/LpImagesClient";
import { BrandAssetsClient } from "@/components/admin/BrandAssetsClient";

export default async function AdminMediaPage() {
  let items: LpMediaRow[] = [];
  let promptDefaultItems: PromptDefaultImageRow[] = [];
  let beforeAfterPairs: LpBeforeAfterPair[] = [];
  let loadError: string | null = null;
  let beforeAfterLoadError: string | null = null;

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

  try {
    // Independent fetch/try-catch on purpose: lp_before_after_pairs is a
    // newer table, so its migration might not be applied yet in some
    // environment — that must never take down the two sections above,
    // which already work today.
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("lp_before_after_pairs")
      .select("id, before_image_url, after_image_url, prompt_code, position, is_active, created_at")
      .order("position", { ascending: true });

    if (error) throw error;
    beforeAfterPairs = data ?? [];
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load before/after pairs for admin:", error);
    beforeAfterLoadError = "Não foi possível carregar os pares Antes/Depois agora.";
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
      {beforeAfterLoadError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {beforeAfterLoadError}
        </p>
      )}
      <LpBeforeAfterClient pairs={beforeAfterPairs} />
      <hr className="border-border" />
      <LpImagesClient items={items} />
      <hr className="border-border" />
      <BrandAssetsClient items={items} />
    </>
  );
}
