import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LibraryClient } from "@/components/library/LibraryClient";
import type { SectionKind } from "@/lib/supabase/catalog";
import { loadLibraryBaseProps, SECTION_KINDS, SECTION_TITLES } from "../../loadLibraryProps";

// "Ver todos" as its own URL (/app/secao/agro, /app/secao/todos) instead
// of only client-side state, so it's shareable/bookmarkable and the
// browser back button works as expected. Renders the exact same
// LibraryClient as the home page, just pre-seeded into its "viewing one
// category" state via initialCategoryView - see
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

export default async function AppSectionPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;

  if (!isValidKindParam(kind)) {
    redirect("/app");
  }

  const base = await loadLibraryBaseProps();

  const initialCategoryView =
    kind === "todos"
      ? { kind: "all" as const, title: "Todos os prompts", total: base.totalCount }
      : { kind, title: SECTION_TITLES[kind], total: base.sectionCounts[kind] };

  return <LibraryClient {...base} initialCategoryView={initialCategoryView} />;
}
