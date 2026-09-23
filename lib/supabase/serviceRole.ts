import { createClient } from "@supabase/supabase-js";

// Bypasses RLS entirely - only for trusted server code that has already
// established who the write is for (the checkout route, after its own
// getUser() check) or that is itself the source of truth (the Mercado
// Pago webhook, verified via lib/mercadopago.ts). Never import this from
// a "use client" file or expose SUPABASE_SERVICE_ROLE_KEY to the browser.

// New-format Supabase secret keys (`sb_secret_...`) are not JWTs. Verified
// directly in @supabase/supabase-js's own source (current as of 2.117.0,
// the latest stable release, and still true in the 3.0.0 prerelease
// line): its PostgREST/Storage fetch path (lib/fetch.ts) already knows
// this - "New-format Supabase API keys (sb_publishable_.../sb_secret_...)
// are not JWTs and must never be sent as a Bearer token - they belong
// only in the apikey header" - but the Auth Admin client (used by
// auth.admin.listUsers/createUser/updateUserById, built in
// SupabaseClient.ts#_initSupabaseAuthClient) never got the same fix: it
// unconditionally sets `Authorization: Bearer <key>` for every key
// format. GoTrue tries to parse that Bearer value as a JWT, fails on a
// sb_secret_ key, and rejects the request with "This endpoint requires
// a valid Bearer token (no_authorization)" - even though the exact same
// key, via `apikey`, already authenticates every other request
// correctly (that's why PROFILES/SUBSCRIPTIONS work while only AUTH
// ADMIN LIST USERS fails).
//
// A legacy JWT service_role key never hits this: isNewFormatKey() is
// false for it, so the request goes out completely unchanged.
const isNewFormatKey = (key: string) => key.startsWith("sb_secret_") || key.startsWith("sb_publishable_");

// Only touches /auth/v1/admin/* requests - every other call (PostgREST,
// Storage, Realtime) goes through this same client's `fetch` untouched,
// so profiles/subscriptions access is unaffected by design.
function createAdminAuthFetch(key: string): typeof fetch {
  return (input, init) => {
    if (!isNewFormatKey(key)) return fetch(input, init);

    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes("/auth/v1/admin/")) return fetch(input, init);

    // apikey (already set correctly by the library) is what GoTrue
    // actually needs for a new-format secret key - drop the
    // JWT-shaped Bearer header it can't parse instead of sending it.
    const headers = new Headers(init?.headers);
    headers.delete("Authorization");
    return fetch(input, { ...init, headers });
  };
}

export function createSupabaseServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service-role não configurado (env vars ausentes).");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: createAdminAuthFetch(serviceRoleKey) },
  });
}
