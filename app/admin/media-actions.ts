"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function refreshLp() {
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
