import type { Metadata } from "next";
import { LibraryClient } from "@/components/library/LibraryClient";
import { loadLibraryBaseProps } from "./loadLibraryProps";

export const metadata: Metadata = {
  title: "Biblioteca de Prompts - MaqAI",
  description: "Explore, favorite e copie prompts de IA testados para máquinas pesadas, agro e equipamentos pesados.",
};

// The parent (protected) layout calls cookies()/auth.getUser(), which
// makes this whole route dynamic regardless of this value - kept mostly
// as documentation of the original caching intent.
export const revalidate = 60;

export default async function AppPage() {
  const base = await loadLibraryBaseProps();
  return <LibraryClient {...base} />;
}
