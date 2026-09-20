import { unstable_rethrow } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LpMediaRow } from "@/lib/supabase/lpMedia";
import type { PromptDefaultImageRow } from "@/lib/supabase/promptDefaults";
import type { LpBeforeAfterPair } from "@/lib/supabase/lpBeforeAfter";
import type { LpShowcaseItem } from "@/lib/supabase/lpShowcase";
import { PromptDefaultImagesClient } from "@/components/admin/PromptDefaultImagesClient";
import { LpBeforeAfterClient } from "@/components/admin/LpBeforeAfterClient";
import { LpShowcaseClient } from "@/components/admin/LpShowcaseClient";
import { SegmentsImagesClient } from "@/components/admin/SegmentsImagesClient";
import { BrandAssetsClient } from "@/components/admin/BrandAssetsClient";
import { MediaSlotSection } from "@/components/admin/MediaSlotSection";
import { LpImageUploadSlot } from "@/components/admin/LpImageUploadSlot";

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
      {message}
    </p>
  );
}

export default async function AdminMediaPage() {
  let items: LpMediaRow[] = [];
  let promptDefaultItems: PromptDefaultImageRow[] = [];
  let beforeAfterPairs: LpBeforeAfterPair[] = [];
  let showcaseItems: LpShowcaseItem[] = [];
  let loadError: string | null = null;
  let beforeAfterLoadError: string | null = null;
  let showcaseLoadError: string | null = null;

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
    // Independent fetch/try-catch on purpose: lp_before_after_pairs and
    // lp_showcase_items are newer tables, so their migrations might not
    // be applied yet in some environment - that must never take down the
    // sections above, which already work today.
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("lp_before_after_pairs")
      .select("id, before_image_url, after_image_url, title, position, is_active, created_at")
      .order("position", { ascending: true });

    if (error) throw error;
    beforeAfterPairs = data ?? [];
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load before/after pairs for admin:", error);
    beforeAfterLoadError = "Não foi possível carregar os pares Antes/Depois agora.";
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("lp_showcase_items")
      .select("id, image_url, title, segment, position, is_active, created_at")
      .order("position", { ascending: true });

    if (error) throw error;
    showcaseItems = data ?? [];
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load showcase items for admin:", error);
    showcaseLoadError = "Não foi possível carregar o mostruário agora.";
  }

  const hero = items.find((item) => item.slot === "hero" && item.identifier === "hero");
  const finalCta = items.find((item) => item.slot === "final_cta" && item.identifier === "final_cta");

  return (
    <>
      <ErrorNote message={loadError} />
      <PromptDefaultImagesClient items={promptDefaultItems} />

      <hr className="border-border" />
      <MediaSlotSection
        title="Hero"
        purpose="Imagem de fundo da seção principal, no topo da página."
        dimension="1920×1080 (16:9) ou maior."
      >
        <LpImageUploadSlot
          slot="hero"
          identifier="hero"
          label="Hero"
          imageUrl={hero?.image_url ?? null}
          rowId={hero?.id}
        />
      </MediaSlotSection>

      <hr className="border-border" />
      <ErrorNote message={beforeAfterLoadError} />
      <LpBeforeAfterClient pairs={beforeAfterPairs} />

      <hr className="border-border" />
      <ErrorNote message={showcaseLoadError} />
      <LpShowcaseClient items={showcaseItems} />

      <hr className="border-border" />
      <SegmentsImagesClient items={items} />

      <hr className="border-border" />
      <MediaSlotSection
        title="CTA final"
        purpose="Imagem de fundo da última seção da página, antes do rodapé."
        dimension="1920×1080 (16:9) ou maior."
      >
        <LpImageUploadSlot
          slot="final_cta"
          identifier="final_cta"
          label="CTA final"
          imageUrl={finalCta?.image_url ?? null}
          rowId={finalCta?.id}
        />
      </MediaSlotSection>

      <hr className="border-border" />
      <BrandAssetsClient items={items} />
    </>
  );
}
