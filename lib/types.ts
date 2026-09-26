import type { Category, Segment, Type, Tag } from "@/lib/taxonomy";

export type PromptCategory = Category;
export type PromptSegment = Segment;
export type PromptType = Type;
export type FilterTag = Tag;

// Structured tutorial content, type=Vídeo only (see
// supabase/migrations/20260926110000_prompts_tutorial_data.sql). null for
// every Imagem/Texto prompt, and for Vídeo prompts that haven't been
// filled in yet.
export interface PromptTutorialData {
  goal: string;
  steps: string[];
  settings: string;
  result: string;
  url: string | null;
}

export interface Prompt {
  id: string;
  code: string;
  title: string;
  description: string;
  category: PromptCategory;
  segment: PromptSegment;
  type: PromptType;
  image_url?: string | null;
  tools: string[];
  prompt: string;
  featured: boolean;
  tags: FilterTag[];
  is_premium: boolean;
  is_tested: boolean;
  created_at: string;
  tutorialData: PromptTutorialData | null;
}
