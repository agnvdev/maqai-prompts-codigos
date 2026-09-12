import type { Metadata } from "next";
import { LibraryClient } from "@/components/library/LibraryClient";

export const metadata: Metadata = {
  title: "Biblioteca de Prompts — MaqAI",
  description: "Explore, favorite e copie prompts de IA para máquinas pesadas, agro e mineração.",
};

export default function AppPage() {
  return <LibraryClient />;
}
