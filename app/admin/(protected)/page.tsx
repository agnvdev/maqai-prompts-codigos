import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminPromptRow } from "@/lib/supabase/catalog";
import { AdminPromptsClient } from "@/components/admin/AdminPromptsClient";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("prompts")
    .select(
      "id, code, title, description, image_url, prompt_text, segment, type, tools, tags, featured, is_premium, is_active, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return <AdminPromptsClient prompts={(data ?? []) as AdminPromptRow[]} />;
}
