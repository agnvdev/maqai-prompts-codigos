import type { Metadata } from "next";
import { LibraryClient } from "@/components/library/LibraryClient";
import {
  getPromptsCount,
  getSectionCount,
  getSectionPrompts,
  type PromptPage,
  type SectionKind,
} from "@/lib/supabase/catalog";
import { getPromptDefaultImagesMap, type PromptDefaultImagesMap } from "@/lib/supabase/promptDefaults";

export const metadata: Metadata = {
  title: "Biblioteca de Prompts — MaqAI",
  description: "Explore, favorite e copie prompts de IA para máquinas pesadas, agro e mineração.",
};

export const revalidate = 60;

const SECTION_KINDS: SectionKind[] = [
  "comeceAqui",
  "maisUsados",
  "codigosVirais",
  "maquinasPesadas",
  "agro",
  "mineracao",
  "combos",
];

export default async function AppPage() {
  const initialSections: Partial<Record<SectionKind, PromptPage>> = {};
  const sectionCounts: Partial<Record<SectionKind, number>> = {};
  let totalCount: number | undefined;
  let defaultImagesMap: PromptDefaultImagesMap = {};

  try {
    // Only the first page of each section is fetched here (bounded,
    // indexed queries) — the catalog can hold 10k+ prompts without this
    // page ever pulling more than a few dozen rows per section. The counts
    // are separate `count: "exact", head: true` queries — no extra rows,
    // just the real totals shown in the UI ("512 prompts disponíveis",
    // per-category counts, "Ver todos").
    const [sectionResults, countResults, total] = await Promise.all([
      Promise.all(SECTION_KINDS.map((kind) => getSectionPrompts({ kind }))),
      Promise.all(SECTION_KINDS.map((kind) => getSectionCount(kind))),
      getPromptsCount(),
    ]);
    SECTION_KINDS.forEach((kind, i) => {
      initialSections[kind] = sectionResults[i];
      sectionCounts[kind] = countResults[i];
    });
    totalCount = total;
  } catch (error) {
    // A misconfigured/unreachable Supabase must not fail this page's
    // prerender and take the whole production build down with it.
    console.error("Failed to load initial catalog sections from Supabase:", error);
  }

  try {
    // Independent try/catch on purpose: the admin-managed pool of
    // per-category/segment/type fallback images (see
    // lib/supabase/promptDefaults.ts) is optional decoration — cards
    // fall back to the TypeIcon placeholder when it's empty or the
    // query fails, so its failure must never take down the sections
    // above (e.g. before the migration adding this table is applied).
    defaultImagesMap = await getPromptDefaultImagesMap();
  } catch (error) {
    console.error("Failed to load prompt default images:", error);
  }

  return (
    <LibraryClient
      initialSections={initialSections}
      sectionCounts={sectionCounts}
      totalCount={totalCount}
      defaultImagesMap={defaultImagesMap}
    />
  );
}
