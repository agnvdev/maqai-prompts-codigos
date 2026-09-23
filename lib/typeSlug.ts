import { TYPES, type Type } from "@/lib/taxonomy";

// URL-safe slugs for the 3 main /app tabs - kept separate from the real
// `type` column values (which have accents: "Vídeo") so ?tipo=videos
// reads cleanly instead of needing percent-encoding everywhere it's
// used (LibraryClient, the home page, and /app/secao/[kind] all import
// this instead of redeclaring the mapping).
export const TYPE_SLUGS: Record<Type, string> = {
  Imagem: "imagens",
  Vídeo: "videos",
  Texto: "textos",
};

const SLUG_TO_TYPE = Object.fromEntries(TYPES.map((type) => [TYPE_SLUGS[type], type])) as Record<string, Type>;

export function typeFromSlug(slug: string | null | undefined): Type | null {
  if (!slug) return null;
  return SLUG_TO_TYPE[slug] ?? null;
}

export function slugFromType(type: Type): string {
  return TYPE_SLUGS[type];
}

// "Default: IMAGENS" - the tab active on first load and whenever ?tipo=
// is missing/invalid.
export const DEFAULT_TAB_TYPE: Type = "Imagem";
