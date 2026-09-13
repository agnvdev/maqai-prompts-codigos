import type { Category, Segment, Type, Tag } from "@/lib/taxonomy";

export type PromptCategory = Category;
export type PromptSegment = Segment;
export type PromptType = Type;
export type FilterTag = Tag;

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
