import { createSupabaseServiceRoleClient } from "@/lib/supabase/serviceRole";

export interface PaymentConfig {
  publicKey: string | null;
  accessToken: string | null;
  webhookSecret: string | null;
}

interface PaymentSettingsRow {
  public_key: string | null;
  access_token: string | null;
  webhook_secret: string | null;
}

// Cross-context read used by the checkout route, the webhook, and
// /checkout's server component - none of those requests carry an admin
// session, so this always goes through the service-role client
// (bypasses the admin-only RLS on payment_settings), same as how
// subscriptions writes work. DB values (set via /admin/settings/payments)
// win; a null column falls back to the env vars that existed before
// this admin UI shipped, so nothing breaks for a deployment that
// hasn't configured this yet.
export async function getEffectivePaymentConfig(): Promise<PaymentConfig> {
  let row: PaymentSettingsRow | null = null;
  try {
    const serviceRole = createSupabaseServiceRoleClient();
    const { data, error } = await serviceRole
      .from("payment_settings")
      .select("public_key, access_token, webhook_secret")
      .eq("id", "mercadopago")
      .maybeSingle();
    if (error) throw error;
    row = data;
  } catch (error) {
    console.error("Failed to load payment settings from Supabase:", error);
  }

  return {
    publicKey: row?.public_key || process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || null,
    accessToken: row?.access_token || process.env.MERCADOPAGO_ACCESS_TOKEN || null,
    webhookSecret: row?.webhook_secret || process.env.MERCADOPAGO_WEBHOOK_SECRET || null,
  };
}

// Last 4 characters only - enough for an admin to recognize "yes, this
// is the token I saved" without the full secret ever reaching the
// browser. Used only by /admin/settings/payments's display, never by
// checkout/webhook (they use the real value from getEffectivePaymentConfig).
export function maskSecret(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 4) return "••••";
  return `••••••••${value.slice(-4)}`;
}
