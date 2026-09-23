import { createSupabaseServiceRoleClient } from "@/lib/supabase/serviceRole";

export interface DiagnosticCheck {
  label: string;
  ok: boolean;
  // "ausente" is only for the 2 plain env-presence checks (nothing to
  // run, nothing threw - the variable just isn't set); every check that
  // actually attempted an operation reports "erro" on failure,
  // regardless of whether the underlying error happened to carry a
  // code. Fixed at the source here instead of guessed from whether
  // `code` is present, since a real error isn't always coded.
  status: "ok" | "ausente" | "erro";
  // Only ever set when ok is false. Never the service-role value
  // itself, a token, a header, or a cookie - just what the Supabase
  // client's own error object exposes (message/code/status), same
  // fields the PostgrestError/AuthError types actually carry.
  message?: string;
  code?: string;
}

function ok(label: string): DiagnosticCheck {
  return { label, ok: true, status: "ok" };
}

function ausente(label: string): DiagnosticCheck {
  return { label, ok: false, status: "ausente" };
}

// Pulls only message + code/status off whatever the client threw.
// Deliberately narrow: never spreads the whole error object (which for
// some error shapes could carry more than intended) and never touches
// request/response internals (no headers, no auth config on the
// client instance).
function erro(label: string, error: unknown): DiagnosticCheck {
  if (error && typeof error === "object") {
    const record = error as { message?: unknown; code?: unknown; status?: unknown };
    const message = typeof record.message === "string" ? record.message : String(error);
    const rawCode = record.code ?? record.status;
    const code = rawCode === undefined || rawCode === null ? undefined : String(rawCode);
    return { label, ok: false, status: "erro", message, code };
  }
  return { label, ok: false, status: "erro", message: String(error) };
}

const CLIENT_UNAVAILABLE_MESSAGE = "Não executado: cliente Supabase (service role) indisponível.";

// Runs 6 independent, minimal checks server-side to pinpoint exactly
// which layer is broken when /admin/settings/test-accounts can't load
// real status - never throws itself (every step has its own
// try/catch), so the caller never needs more than a single await.
export async function runServiceRoleDiagnostics(): Promise<DiagnosticCheck[]> {
  const checks: DiagnosticCheck[] = [];

  checks.push(
    process.env.NEXT_PUBLIC_SUPABASE_URL ? ok("SUPABASE URL") : ausente("SUPABASE URL")
  );
  checks.push(
    process.env.SUPABASE_SERVICE_ROLE_KEY ? ok("SERVICE ROLE ENV") : ausente("SERVICE ROLE ENV")
  );

  let serviceRole: ReturnType<typeof createSupabaseServiceRoleClient> | null = null;
  try {
    serviceRole = createSupabaseServiceRoleClient();
    checks.push(ok("SERVICE ROLE CLIENT"));
  } catch (error) {
    checks.push(erro("SERVICE ROLE CLIENT", error));
  }

  if (!serviceRole) {
    checks.push(erro("AUTH ADMIN LIST USERS", { message: CLIENT_UNAVAILABLE_MESSAGE }));
    checks.push(erro("PROFILES", { message: CLIENT_UNAVAILABLE_MESSAGE }));
    checks.push(erro("SUBSCRIPTIONS", { message: CLIENT_UNAVAILABLE_MESSAGE }));
    return checks;
  }

  try {
    // perPage: 1 - this only needs to prove the Admin API call itself
    // succeeds (auth + permissions), not fetch real data.
    const { error } = await serviceRole.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    checks.push(ok("AUTH ADMIN LIST USERS"));
  } catch (error) {
    checks.push(erro("AUTH ADMIN LIST USERS", error));
  }

  try {
    const { error } = await serviceRole.from("profiles").select("id").limit(1);
    if (error) throw error;
    checks.push(ok("PROFILES"));
  } catch (error) {
    checks.push(erro("PROFILES", error));
  }

  try {
    const { error } = await serviceRole.from("subscriptions").select("id").limit(1);
    if (error) throw error;
    checks.push(ok("SUBSCRIPTIONS"));
  } catch (error) {
    checks.push(erro("SUBSCRIPTIONS", error));
  }

  return checks;
}
