import type { Metadata } from "next";
import { LibraryClient } from "@/components/library/LibraryClient";
import { getCatalogPrompts } from "@/lib/supabase/catalog";

export const metadata: Metadata = {
  title: "Biblioteca de Prompts — MaqAI",
  description: "Explore, favorite e copie prompts de IA para máquinas pesadas, agro e mineração.",
};

export const revalidate = 60;

export default async function AppPage() {
  const prompts = await getCatalogPrompts();
  return <LibraryClient prompts={prompts} />;
}
