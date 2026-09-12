"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/supabase/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseList(value: FormDataEntryValue | null): string[] {
  return (value?.toString() ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Não autorizado.");
  return admin;
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
