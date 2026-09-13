"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ImportResult, ImportRow } from "@/lib/admin/import";

function parseList(value: FormDataEntryValue | null): string[] {
  return (value?.toString() ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function refreshCatalog() {
  revalidatePath("/admin");
  revalidatePath("/app");
}

export async function savePromptAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = formData.get("id")?.toString();
  const code = formData.get("code")?.toString().trim() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";

  if (!code || !title) {
    throw new Error("Código e título são obrigatórios.");
  }

  const payload = {
    code,
    title,
    description: formData.get("description")?.toString().trim() || null,
    prompt_text: formData.get("prompt_text")?.toString().trim() || null,
    image_url: formData.get("image_url")?.toString().trim() || null,
    segment: formData.get("segment")?.toString() || null,
    type: formData.get("type")?.toString() || null,
    tools: parseList(formData.get("tools")),
    tags: parseList(formData.get("tags")),
    featured: formData.get("featured") === "on",
    is_premium: formData.get("is_premium") === "on",
    is_active: formData.get("is_active") === "on",
  };

  const { error } = id
    ? await supabase.from("prompts").update(payload).eq("id", id)
    : await supabase.from("prompts").insert(payload);

  if (error) throw new Error(error.message);

  refreshCatalog();
}

export async function deletePromptAction(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("prompts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  refreshCatalog();
}

export async function toggleActiveAction(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("prompts")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);

  refreshCatalog();
}

export async function importPromptsAction(rows: ImportRow[]): Promise<ImportResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const result: ImportResult = { imported: 0, skippedDuplicates: 0, invalid: 0, errors: [] };

  const seen = new Set<string>();
  const candidates: ImportRow[] = [];

  for (const row of rows) {
    const code = row.code?.trim();
    const title = row.title?.trim();

    if (!code || !title) {
      result.invalid += 1;
      continue;
    }
    if (seen.has(code)) {
      result.skippedDuplicates += 1;
      continue;
    }
    seen.add(code);
    candidates.push({ ...row, code, title });
  }

  if (candidates.length === 0) return result;

  const { data: existing, error: existingError } = await supabase
    .from("prompts")
    .select("code")
    .in(
      "code",
      candidates.map((r) => r.code)
    );

  if (existingError) {
    result.errors.push(existingError.message);
    return result;
  }

  const existingCodes = new Set((existing ?? []).map((r) => r.code as string));
  const toInsert = candidates.filter((r) => {
    if (existingCodes.has(r.code)) {
      result.skippedDuplicates += 1;
      return false;
    }
    return true;
  });

  if (toInsert.length === 0) return result;

  const payload = toInsert.map((r) => ({
    code: r.code,
    title: r.title,
    description: r.description || null,
    prompt_text: r.prompt_text || null,
    image_url: r.image_url || null,
    segment: r.segment || null,
    type: r.type || null,
    tools: r.tools ?? [],
    tags: r.tags ?? [],
    featured: !!r.featured,
    is_premium: !!r.is_premium,
    is_active: r.is_active ?? true,
  }));

  const { error: insertError } = await supabase.from("prompts").insert(payload);

  if (insertError) {
    result.errors.push(insertError.message);
    return result;
  }

  result.imported = toInsert.length;
  refreshCatalog();
  return result;
}
