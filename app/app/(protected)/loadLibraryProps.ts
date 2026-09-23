import {
  getPromptsCount,
  getSectionCount,
  getSectionPrompts,
  getTypeCounts,
  type PromptPage,
  type SectionKind,
} from "@/lib/supabase/catalog";
import type { PromptType } from "@/lib/types";
import { getPromptDefaultImagesMap, type PromptDefaultImagesMap } from "@/lib/supabase/promptDefaults";
import { getActiveLpMediaMap } from "@/lib/supabase/lpMedia";

// Shared by app/app/(protected)/page.tsx (the home view) and
// app/app/(protected)/secao/[kind]/page.tsx (a section's "Ver todos" as
// its own URL) - both need the exact same base data, so this is the one
// place that fetches it instead of duplicating the three try/catch
// blocks in two files.
export const SECTION_KINDS: SectionKind[] = [
  "comeceAqui",
  "maisUsados",
  "codigosVirais",
  "maquinasPesadas",
  "agro",
  "mineracao",
  "combos",
];

export const SECTION_TITLES: Record<SectionKind, string> = {
  comeceAqui: "Comece aqui",
  maisUsados: "Mais usados",
  codigosVirais: "Códigos virais",
  maquinasPesadas: "Máquinas pesadas",
  agro: "Agro",
  mineracao: "Mineração",
  combos: "Combos",
};

export interface LibraryBaseProps {
  initialSections: Partial<Record<SectionKind, PromptPage>>;
  sectionCounts: Partial<Record<SectionKind, number>>;
  totalCount?: number;
  typeCounts: Partial<Record<PromptType, number>>;
  defaultImagesMap: PromptDefaultImagesMap;
  logoUrl?: string;
}

// activeType scopes every section/count query - "Nunca misturar tipos em
// uma mesma seção, contagem ou Ver todos" is enforced right here, at the
// one place that fetches this data, not left to each caller to remember.
export async function loadLibraryBaseProps(activeType: PromptType): Promise<LibraryBaseProps> {
  const initialSections: Partial<Record<SectionKind, PromptPage>> = {};
  const sectionCounts: Partial<Record<SectionKind, number>> = {};
  let totalCount: number | undefined;
  let typeCounts: Partial<Record<PromptType, number>> = {};
  let defaultImagesMap: PromptDefaultImagesMap = {};
  let logoUrl: string | undefined;

  try {
    // Only the first page of each section is fetched here (bounded,
    // indexed queries) — the catalog can hold 10k+ prompts without this
    // ever pulling more than a few dozen rows per section. The counts
    // are separate `count: "exact", head: true` queries — no extra rows,
    // just the real totals shown in the UI (per-type tab labels,
    // per-section counts, "Ver todos", "4 de 52").
    const [sectionResults, countResults, total] = await Promise.all([
      Promise.all(SECTION_KINDS.map((kind) => getSectionPrompts({ kind, type: activeType }))),
      Promise.all(SECTION_KINDS.map((kind) => getSectionCount(kind, activeType))),
      getPromptsCount({ type: activeType }),
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
    // Independent try/catch: the 3 tab counts are their own 3 queries,
    // separate from the section/type-scoped ones above - one failing
    // must not take down the other.
    typeCounts = await getTypeCounts();
  } catch (error) {
    console.error("Failed to load per-type counts from Supabase:", error);
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

  try {
    // Same lp_media table already used by the LP - independent try/catch
    // just to be consistent with the other decorative fetches above.
    const logoMedia = await getActiveLpMediaMap("logo");
    logoUrl = logoMedia.Logo;
  } catch (error) {
    console.error("Failed to load logo media:", error);
  }

  return { initialSections, sectionCounts, totalCount, typeCounts, defaultImagesMap, logoUrl };
}
