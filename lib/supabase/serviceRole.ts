import { createClient } from "@supabase/supabase-js";

// Bypasses RLS entirely - only for trusted server code that has already
// established who the write is for (the checkout route, after its own
// getUser() check) or that is itself the source of truth (the Mercado
// Pago webhook, verified via lib/mercadopago.ts). Never import this from
// a "use client" file or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createSupabaseServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service-role não configurado (env vars ausentes).");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
