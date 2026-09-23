import {
  getPromptsCount,
  getSectionCount,
  getSectionPrompts,
  type PromptPage,
  type SectionKind,
} from "@/lib/supabase/catalog";
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
  defaultImagesMap: PromptDefaultImagesMap;
  logoUrl?: string;
}

export async function loadLibraryBaseProps(): Promise<LibraryBaseProps> {
  const initialSections: Partial<Record<SectionKind, PromptPage>> = {};
  const sectionCounts: Partial<Record<SectionKind, number>> = {};
  let totalCount: number | undefined;
  let defaultImagesMap: PromptDefaultImagesMap = {};
  let logoUrl: string | undefined;

  try {
    // Only the first page of each section is fetched here (bounded,
    // indexed queries) — the catalog can hold 10k+ prompts without this
    // ever pulling more than a few dozen rows per section. The counts
    // are separate `count: "exact", head: true` queries — no extra rows,
    // just the real totals shown in the UI ("512 prompts disponíveis",
    // per-category counts, "Ver todos", "4 de 52").
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

  try {
    // Same lp_media table already used by the LP - independent try/catch
    // just to be consistent with the other decorative fetches above.
    const logoMedia = await getActiveLpMediaMap("logo");
    logoUrl = logoMedia.Logo;
  } catch (error) {
    console.error("Failed to load logo media:", error);
  }

  return { initialSections, sectionCounts, totalCount, defaultImagesMap, logoUrl };
}
