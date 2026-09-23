import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LibraryClient } from "@/components/library/LibraryClient";
import type { SectionKind } from "@/lib/supabase/catalog";
import { loadLibraryBaseProps, SECTION_KINDS, SECTION_TITLES } from "../../loadLibraryProps";
import { typeFromSlug, DEFAULT_TAB_TYPE } from "@/lib/typeSlug";

// "Ver todos" as its own URL (/app/secao/agro?tipo=videos,
// /app/secao/todos?tipo=textos) instead of only client-side state, so
// it's shareable/bookmarkable and the browser back button works as
// expected. Type is carried as a query param alongside the section in
// the path segment - both are read here and threaded through every
// query (loadLibraryBaseProps, the categoryView total below), so the
// grid this renders can never mix types with the active tab. Renders
// the exact same LibraryClient as the home page, just pre-seeded into
// its "viewing one category" state via initialCategoryView - see
// components/library/LibraryClient.tsx.
function isValidKindParam(value: string): value is SectionKind | "todos" {
  return value === "todos" || (SECTION_KINDS as string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string }>;
}): Promise<Metadata> {
  const { kind } = await params;
  const title = isValidKindParam(kind) ? (kind === "todos" ? "Todos os prompts" : SECTION_TITLES[kind]) : "Prompts";
  return { title: `${title} - MaqAI` };
}

export default async function AppSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { kind } = await params;
  const query = await searchParams;

  if (!isValidKindParam(kind)) {
    redirect("/app");
  }

  const tipoParam = typeof query.tipo === "string" ? query.tipo : null;
  const activeType = typeFromSlug(tipoParam) ?? DEFAULT_TAB_TYPE;

  const base = await loadLibraryBaseProps(activeType);

  const initialCategoryView =
    kind === "todos"
      ? { kind: "all" as const, title: "Todos os prompts", total: base.totalCount }
      : { kind, title: SECTION_TITLES[kind], total: base.sectionCounts[kind] };

  return <LibraryClient {...base} initialType={activeType} initialCategoryView={initialCategoryView} />;
}
