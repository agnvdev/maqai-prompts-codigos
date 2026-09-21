"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Same admin-write pattern as actions.ts/media-actions.ts: requireAdmin()
// first, then write with the admin's own RLS-scoped session (the
// "admins can insert/update payment settings" policies allow it) -
// no service-role needed here, only checkout/webhook (which run
// without an admin session) use that.
export async function savePaymentSettingsAction(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  // Blank field = "keep the current value" - only fields the admin
  // actually typed into get overwritten, so re-saving the Public Key
  // alone never wipes out an already-configured Access Token.
  const publicKey = formData.get("public_key")?.toString().trim();
  const accessToken = formData.get("access_token")?.toString().trim();
  const webhookSecret = formData.get("webhook_secret")?.toString().trim();

  const payload: Record<string, unknown> = {
    id: "mercadopago",
    updated_at: new Date().toISOString(),
    updated_by: admin.id,
  };
  if (publicKey) payload.public_key = publicKey;
  if (accessToken) payload.access_token = accessToken;
  if (webhookSecret) payload.webhook_secret = webhookSecret;

  const { error } = await supabase.from("payment_settings").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings/payments");
}
