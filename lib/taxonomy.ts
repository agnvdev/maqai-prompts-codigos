// Single source of truth for the values accepted across /app and /admin
// (filters, admin form selects, and the bulk importer). Anything that
// needs one of these lists — or needs to validate/normalize a value
// against one — should import it from here instead of redeclaring it.

export const CATEGORIES = ["Essenciais", "Máquinas", "Agro", "Mineração", "Vendas", "Combos"] as const;
export type Category = (typeof CATEGORIES)[number];

export const SEGMENTS = ["Geral", "Máquinas Pesadas", "Agro", "Mineração"] as const;
export type Segment = (typeof SEGMENTS)[number];

export const TYPES = ["Imagem", "Vídeo", "Texto"] as const;
export type Type = (typeof TYPES)[number];

export const TAGS = [
  "Essenciais",
  "Máquinas",
  "Agro",
  "Mineração",
  "Imagem",
  "Vídeo",
  "Instagram",
  "Vendas",
  "Códigos",
  "Combos",
] as const;
export type Tag = (typeof TAGS)[number];

export const TOOLS = [
  "Midjourney",
  "DALL-E",
  "Adobe Firefly",
  "Flux",
  "Leonardo AI",
  "Blender",
  "Runway",
  "Sora",
  "Pika Labs",
  "Kling",
  "ChatGPT",
  "Gemini",
  "CapCut",
  "Canva",
] as const;
export type Tool = (typeof TOOLS)[number];

export const DEFAULT_CATEGORY: Category = "Essenciais";
export const DEFAULT_SEGMENT: Segment = "Geral";
export const DEFAULT_TYPE: Type = "Imagem";

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function buildLookup<T extends string>(values: readonly T[], aliases: Record<string, T>): Map<string, T> {
  const map = new Map<string, T>();
  for (const value of values) map.set(normalizeKey(value), value);
  for (const [alias, target] of Object.entries(aliases)) map.set(normalizeKey(alias), target);
  return map;
}

const CATEGORY_ALIASES: Record<string, Category> = {
  essencial: "Essenciais",
  essential: "Essenciais",
  basico: "Essenciais",
  maquina: "Máquinas",
  machines: "Máquinas",
  machine: "Máquinas",
  agriculture: "Agro",
  agricultura: "Agro",
  agronegocio: "Agro",
  mining: "Mineração",
  sales: "Vendas",
  combo: "Combos",
};
const CATEGORY_LOOKUP = buildLookup(CATEGORIES, CATEGORY_ALIASES);

const SEGMENT_ALIASES: Record<string, Segment> = {
  general: "Geral",
  outro: "Geral",
  outros: "Geral",
  "maquinas pesadas": "Máquinas Pesadas",
  "heavy machinery": "Máquinas Pesadas",
  "heavy machines": "Máquinas Pesadas",
  maquinas: "Máquinas Pesadas",
  machines: "Máquinas Pesadas",
  agriculture: "Agro",
  agricultura: "Agro",
  mining: "Mineração",
  mineracao: "Mineração",
};
const SEGMENT_LOOKUP = buildLookup(SEGMENTS, SEGMENT_ALIASES);

const TYPE_ALIASES: Record<string, Type> = {
  image: "Imagem",
  photo: "Imagem",
  foto: "Imagem",
  img: "Imagem",
  video: "Vídeo",
  text: "Texto",
};
const TYPE_LOOKUP = buildLookup(TYPES, TYPE_ALIASES);

const TOOL_ALIASES: Record<string, Tool> = {
  mj: "Midjourney",
  dalle: "DALL-E",
  "dall e": "DALL-E",
  "openai dalle": "DALL-E",
  firefly: "Adobe Firefly",
  "adobe fyrefly": "Adobe Firefly",
  blackforestlabs: "Flux",
  "black forest labs": "Flux",
  "flux pro": "Flux",
  leonardo: "Leonardo AI",
  "leonardoai": "Leonardo AI",
  runwayml: "Runway",
  "runway ml": "Runway",
  "openai sora": "Sora",
  pika: "Pika Labs",
  "pika labs ai": "Pika Labs",
  "kling ai": "Kling",
  gpt: "ChatGPT",
  chatgpt4: "ChatGPT",
  openai: "ChatGPT",
  "google gemini": "Gemini",
  cap_cut: "CapCut",
};
const TOOL_LOOKUP = buildLookup(TOOLS, TOOL_ALIASES);

export function normalizeCategory(value: string | null | undefined): Category | null {
  if (!value) return null;
  return CATEGORY_LOOKUP.get(normalizeKey(value)) ?? null;
}

export function normalizeSegment(value: string | null | undefined): Segment | null {
  if (!value) return null;
  return SEGMENT_LOOKUP.get(normalizeKey(value)) ?? null;
}

export function normalizeType(value: string | null | undefined): Type | null {
  if (!value) return null;
  return TYPE_LOOKUP.get(normalizeKey(value)) ?? null;
}

export function normalizeTool(value: string): Tool | null {
  return TOOL_LOOKUP.get(normalizeKey(value)) ?? null;
}
