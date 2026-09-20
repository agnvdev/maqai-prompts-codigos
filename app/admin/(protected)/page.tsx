import { unstable_rethrow } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminPromptRow } from "@/lib/supabase/catalog";
import { AdminPromptsClient } from "@/components/admin/AdminPromptsClient";

export default async function AdminPage() {
  let prompts: AdminPromptRow[] = [];
  let loadError: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("prompts")
      .select(
        "id, code, title, description, image_url, prompt_text, segment, type, tools, tags, featured, is_premium, is_tested, is_active, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    prompts = (data ?? []) as AdminPromptRow[];
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load prompts for admin:", error);
    loadError = "Não foi possível carregar o catálogo agora. Tente novamente em instantes.";
  }

  return (
    <>
      {loadError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {loadError}
        </p>
      )}
      <AdminPromptsClient prompts={prompts} />
    </>
  );
}
