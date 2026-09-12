import { supabase } from "@/lib/supabase/client";

export interface CategoryRow {
  id: string;
  name: string;
  created_at: string;
}

export interface PromptRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
}

export async function getCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, created_at")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getActivePrompts(): Promise<PromptRow[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select("id, code, title, description, image_url, category_id, is_premium, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
