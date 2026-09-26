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
import { MediaSectionCard } from "@/components/admin/MediaSectionCard";
import { LpImageUploadSlot } from "@/components/admin/LpImageUploadSlot";
import { AdminMediaTabs } from "@/components/admin/AdminMediaTabs";

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
  const heroMobile = items.find((item) => item.slot === "hero" && item.identifier === "hero_mobile");
  const finalCta = items.find((item) => item.slot === "final_cta" && item.identifier === "final_cta");
  const finalCtaMobile = items.find(
    (item) => item.slot === "final_cta" && item.identifier === "final_cta_mobile"
  );

  // Order matches the real render order in app/page.tsx: Header (logo),
  // Hero, BeforeAfter, Showcase, Segments, ..., FinalCta, Footer (logo).
  // Marca/Logo is cross-cutting (header + footer + /app + auth pages), so
  // it sits in its own card at the end rather than inside the page flow.
  const landingPage = (
    <>
      <ErrorNote message={loadError} />

      <MediaSectionCard title="Hero" whereUsed="Topo da página inicial, logo abaixo do cabeçalho.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="max-w-xs">
            <LpImageUploadSlot
              slot="hero"
              identifier="hero_mobile"
              label="Mobile"
              imageUrl={heroMobile?.image_url ?? null}
              rowId={heroMobile?.id}
              whereUsed="Usada em telas até 640px. Sem esta imagem, a versão Desktop é usada no lugar."
              dimension="1080×1920 (9:16)."
            />
          </div>
          <div className="max-w-xs">
            <LpImageUploadSlot
              slot="hero"
              identifier="hero"
              label="Desktop"
              imageUrl={hero?.image_url ?? null}
              rowId={hero?.id}
              whereUsed="Usada em telas a partir de 640px."
              dimension="1920×1080 (16:9) ou maior."
            />
          </div>
        </div>
      </MediaSectionCard>

      <MediaSectionCard
        title="Antes e Depois"
        whereUsed="Seção Antes e depois da página inicial, entre o Hero e o Mostruário."
      >
        <ErrorNote message={beforeAfterLoadError} />
        <LpBeforeAfterClient pairs={beforeAfterPairs} />
      </MediaSectionCard>

      <MediaSectionCard
        title="Exemplos / Mostruário"
        whereUsed="Seção Mostruário da página inicial, logo após Antes e Depois."
      >
        <ErrorNote message={showcaseLoadError} />
        <LpShowcaseClient items={showcaseItems} />
      </MediaSectionCard>

      <MediaSectionCard
        title="Segmentos"
        whereUsed="Cards de segmento (Máquinas Pesadas, Agro, Mineração, Equipamentos Pesados) na página inicial."
      >
        <SegmentsImagesClient items={items} />
      </MediaSectionCard>

      <MediaSectionCard
        title="CTA final"
        whereUsed="Fundo da última seção da página inicial, antes do rodapé."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="max-w-xs">
            <LpImageUploadSlot
              slot="final_cta"
              identifier="final_cta_mobile"
              label="Mobile"
              imageUrl={finalCtaMobile?.image_url ?? null}
              rowId={finalCtaMobile?.id}
              whereUsed="Usada em telas até 640px. Sem esta imagem, a versão Desktop é usada no lugar."
              dimension="1080×1920 (9:16)."
            />
          </div>
          <div className="max-w-xs">
            <LpImageUploadSlot
              slot="final_cta"
              identifier="final_cta"
              label="Desktop"
              imageUrl={finalCta?.image_url ?? null}
              rowId={finalCta?.id}
              whereUsed="Usada em telas a partir de 640px."
              dimension="1920×1080 (16:9) ou maior."
            />
          </div>
        </div>
      </MediaSectionCard>

      <MediaSectionCard
        title="Marca / Logo"
        whereUsed="Cabeçalho e rodapé da página inicial, e cabeçalho do /app, login e demais páginas de autenticação."
      >
        <BrandAssetsClient items={items} />
      </MediaSectionCard>
    </>
  );

  const promptImages = (
    <>
      <p className="rounded-xl border border-border bg-surface/60 p-3 text-xs text-muted">
        Usadas nos cards dos prompts. Não aparecem automaticamente na Landing Page.
      </p>
      <PromptDefaultImagesClient items={promptDefaultItems} />
    </>
  );

  return <AdminMediaTabs landingPage={landingPage} promptImages={promptImages} />;
}
