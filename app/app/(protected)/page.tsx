import type { Metadata } from "next";
import { LibraryClient } from "@/components/library/LibraryClient";
import { loadLibraryBaseProps } from "./loadLibraryProps";
import { typeFromSlug, DEFAULT_TAB_TYPE } from "@/lib/typeSlug";

export const metadata: Metadata = {
  title: "Biblioteca de Prompts - MaqAI",
  description: "Explore, favorite e copie prompts de IA testados para máquinas pesadas, agro e equipamentos pesados.",
};

// The parent (protected) layout calls cookies()/auth.getUser(), which
// makes this whole route dynamic regardless of this value - kept mostly
// as documentation of the original caching intent.
export const revalidate = 60;

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tipoParam = typeof params.tipo === "string" ? params.tipo : null;
  const activeType = typeFromSlug(tipoParam) ?? DEFAULT_TAB_TYPE;

  const base = await loadLibraryBaseProps(activeType);
  return <LibraryClient {...base} initialType={activeType} />;
}
