"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function refreshLp() {
  revalidatePath("/admin/media");
  revalidatePath("/");
}

function refreshPromptDefaults() {
  revalidatePath("/admin/media");
  revalidatePath("/app");
}

function refreshBeforeAfter() {
  revalidatePath("/admin/media");
  revalidatePath("/");
}

export async function saveLpMediaAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = formData.get("id")?.toString();
  const slot = formData.get("slot")?.toString().trim() ?? "";
  const identifier = formData.get("identifier")?.toString().trim() ?? "";

  if (!slot || !identifier) {
    throw new Error("Slot e identificador são obrigatórios.");
  }

  const payload = {
    slot,
    identifier,
    position: Number(formData.get("position") ?? 0) || 0,
    image_url: formData.get("image_url")?.toString().trim() || null,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = id
    ? await supabase.from("lp_media").update(payload).eq("id", id)
    : await supabase.from("lp_media").upsert(payload, { onConflict: "slot,identifier" });

  if (error) throw new Error(error.message);

  refreshLp();
}

export async function deleteLpMediaAction(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("lp_media").delete().eq("id", id);
  if (error) throw new Error(error.message);

  refreshLp();
}

export async function toggleLpMediaActiveAction(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("lp_media").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  refreshLp();
}

export async function savePromptDefaultImageAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = formData.get("id")?.toString();
  const axis = formData.get("axis")?.toString().trim() ?? "";
  const value = formData.get("value")?.toString().trim() ?? "";
  const imageUrl = formData.get("image_url")?.toString().trim() ?? "";

  if (!["category", "segment", "type"].includes(axis) || !value || !imageUrl) {
    throw new Error("Eixo, valor e imagem são obrigatórios.");
  }

  const payload = {
    axis,
    value,
    image_url: imageUrl,
    position: Number(formData.get("position") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = id
    ? await supabase.from("prompt_default_images").update(payload).eq("id", id)
    : await supabase.from("prompt_default_images").insert(payload);

  if (error) throw new Error(error.message);

  refreshPromptDefaults();
}

export async function deletePromptDefaultImageAction(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("prompt_default_images").delete().eq("id", id);
  if (error) throw new Error(error.message);

  refreshPromptDefaults();
}

export async function togglePromptDefaultImageActiveAction(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("prompt_default_images")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);

  refreshPromptDefaults();
}

export async function saveLpBeforeAfterPairAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = formData.get("id")?.toString();
  const beforeImageUrl = formData.get("before_image_url")?.toString().trim() ?? "";
  const afterImageUrl = formData.get("after_image_url")?.toString().trim() ?? "";

  if (!beforeImageUrl || !afterImageUrl) {
    throw new Error("As imagens de Antes e Depois são obrigatórias.");
  }

  const payload = {
    before_image_url: beforeImageUrl,
    after_image_url: afterImageUrl,
    prompt_code: formData.get("prompt_code")?.toString().trim() || null,
    position: Number(formData.get("position") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = id
    ? await supabase.from("lp_before_after_pairs").update(payload).eq("id", id)
    : await supabase.from("lp_before_after_pairs").insert(payload);

  if (error) throw new Error(error.message);

  refreshBeforeAfter();
}

export async function deleteLpBeforeAfterPairAction(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("lp_before_after_pairs").delete().eq("id", id);
  if (error) throw new Error(error.message);

  refreshBeforeAfter();
}

export async function toggleLpBeforeAfterPairActiveAction(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("lp_before_after_pairs")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);

  refreshBeforeAfter();
}
