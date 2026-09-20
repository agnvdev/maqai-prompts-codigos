// Static fallbacks used only until an admin uploads a real photo via
// /admin/media (every slot here has a corresponding upload control).
// These point at picsum.photos placeholders rather than local files -
// `public/images/*.jpg` was referenced here previously but never
// actually existed, so every one of these images was silently 404ing.
export const HERO_IMAGE = "https://picsum.photos/seed/maqai-hero-heavy-machinery/1920/1080";

// The landing page's marketing segments - distinct from the prompt
// taxonomy's Segment type (lib/taxonomy.ts), which "Equipamentos
// Pesados" isn't part of. Shared by the Segments section and the
// Mostruário's optional segment label.
export const LP_SEGMENTS = ["Máquinas Pesadas", "Agro", "Mineração", "Equipamentos Pesados"] as const;

export const SEGMENT_IMAGES: Record<string, string> = {
  "Máquinas Pesadas": "https://picsum.photos/seed/maqai-segment-heavy/1200/1500",
  Agro: "https://picsum.photos/seed/maqai-segment-agro/1200/1500",
  Mineração: "https://picsum.photos/seed/maqai-segment-mining/1200/1500",
  "Equipamentos Pesados": "https://picsum.photos/seed/maqai-segment-equipment/1200/1500",
  Geral: HERO_IMAGE,
};
