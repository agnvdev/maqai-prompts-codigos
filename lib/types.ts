export type PromptCategory =
  | "Essenciais"
  | "Máquinas"
  | "Agro"
  | "Mineração"
  | "Vendas"
  | "Combos";

export type PromptSegment = "Geral" | "Máquinas Pesadas" | "Agro" | "Mineração";

export type PromptType = "Imagem" | "Vídeo" | "Texto";

export type FilterTag =
  | "Essenciais"
  | "Máquinas"
  | "Agro"
  | "Mineração"
  | "Imagem"
  | "Vídeo"
  | "Instagram"
  | "Vendas"
  | "Códigos"
  | "Combos";

export interface Prompt {
  id: string;
  code: string;
  title: string;
  description: string;
  category: PromptCategory;
  segment: PromptSegment;
  type: PromptType;
  tools: string[];
  prompt: string;
  featured: boolean;
  tags: FilterTag[];
}
