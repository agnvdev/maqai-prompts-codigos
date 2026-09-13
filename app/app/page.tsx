import type { Metadata } from "next";
import { LibraryClient } from "@/components/library/LibraryClient";
import { getCatalogPrompts } from "@/lib/supabase/catalog";
import type { Prompt } from "@/lib/types";

export const metadata: Metadata = {
  title: "Biblioteca de Prompts — MaqAI",
  description: "Explore, favorite e copie prompts de IA para máquinas pesadas, agro e mineração.",
};

export const revalidate = 60;

export default async function AppPage() {
  let prompts: Prompt[] = [];

  try {
    prompts = await getCatalogPrompts();
  } catch (error) {
    // A misconfigured/unreachable Supabase must not fail this page's
    // prerender and take the whole production build down with it.
    console.error("Failed to load catalog from Supabase:", error);
  }

  return <LibraryClient prompts={prompts} />;
}
