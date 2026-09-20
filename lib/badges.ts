import type { Prompt } from "@/lib/types";

export type PromptBadgeKind = "exclusivo" | "testado" | "novo" | "em-alta";

export interface PromptBadge {
  kind: PromptBadgeKind;
  label: string;
}

const NEW_WINDOW_DAYS = 7;
const MAX_BADGES = 2;

// Every badge here reads a real column (is_premium, is_tested,
// created_at, featured) — never inferred or fabricated. A prompt with no
// qualifying signal gets no badges; "Testado" in particular only shows
// when an admin has explicitly marked the prompt as tested in the
// database (see is_tested in supabase/migrations), never by default.
export function getPromptBadges(prompt: Prompt, now: Date = new Date()): PromptBadge[] {
  const badges: PromptBadge[] = [];

  if (prompt.is_premium) badges.push({ kind: "exclusivo", label: "Exclusivo" });
  if (prompt.is_tested) badges.push({ kind: "testado", label: "Testado" });

  const ageMs = now.getTime() - new Date(prompt.created_at).getTime();
  if (ageMs >= 0 && ageMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
    badges.push({ kind: "novo", label: "Novo" });
  }

  if (prompt.featured) badges.push({ kind: "em-alta", label: "Em alta" });

  return badges.slice(0, MAX_BADGES);
}
