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
        "id, code, title, description, image_url, prompt_text, segment, type, tools, tags, featured, is_premium, is_tested, is_active, created_at, categories(name)"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    const rows = (data ?? []) as unknown as Array<
      Omit<AdminPromptRow, "catalog_number"> & { categories: { name: string } | null }
    >;
    prompts = rows.map(({ categories, ...row }) => ({
      ...row,
      category: categories?.name ?? null,
      catalog_number: null,
    }));
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load prompts for admin:", error);
    loadError = "Não foi possível carregar o catálogo agora. Tente novamente em instantes.";
  }

  try {
    // Independent fetch/try-catch on purpose: catalog_number is a newer
    // column (see supabase/migrations/20260926090000_prompts_catalog_number.sql).
    // If that migration isn't applied yet in some environment, the prompt
    // list above must keep working - catalog numbers just don't show
    // until then.
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("prompts").select("id, catalog_number");
    if (error) throw error;

    const numberById = new Map((data ?? []).map((row) => [row.id, row.catalog_number as number]));
    prompts = prompts.map((p) => ({ ...p, catalog_number: numberById.get(p.id) ?? null }));
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load catalog numbers for admin:", error);
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
