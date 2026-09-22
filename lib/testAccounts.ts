import { createSupabaseServiceRoleClient } from "@/lib/supabase/serviceRole";
import {
  TEST_ADMIN_EMAIL,
  TEST_CLIENT_EMAIL,
  TEST_SUBSCRIPTION_ID,
  TEST_ENV_UNAVAILABLE_MESSAGE,
} from "@/lib/testAccountsConstants";

export { TEST_ADMIN_EMAIL, TEST_CLIENT_EMAIL, TEST_SUBSCRIPTION_ID, TEST_ENV_UNAVAILABLE_MESSAGE };

export interface TestAccountsStatus {
  adminOk: boolean;
  clienteOk: boolean;
  assinaturaOk: boolean;
  assinaturaStatus: string | null;
  // true only when the service-role connection itself is missing/broken
  // (env vars absent, or the Admin API call failed outright) - every
  // other partial failure just leaves the affected field false/null
  // instead of flipping this, so a single degraded check never hides
  // the ones that did succeed.
  unavailable: boolean;
}

const EMPTY_STATUS: TestAccountsStatus = {
  adminOk: false,
  clienteOk: false,
  assinaturaOk: false,
  assinaturaStatus: null,
  unavailable: true,
};

function logStageError(stage: string, error: unknown) {
  // Never log the service-role key or any request header - Supabase
  // client errors (AuthError/PostgrestError) only ever carry
  // message/code/details/hint, never the credentials used to connect.
  const detail =
    error instanceof Error ? { message: error.message, name: error.name } : { message: String(error) };
  console.error(`[test-accounts] ${stage} failed:`, detail);
}

type ServiceRoleClient = ReturnType<typeof createSupabaseServiceRoleClient>;

// Auth Admin has no getUserByEmail - createUser() is tried first (the
// common case after the very first run is "already exists", which is
// cheap to detect from its own error), falling back to a list+find only
// when that happens. Idempotent either way: same 2 users, no duplicates,
// no matter how many times this runs.
async function ensureTestUser(
  serviceRole: ServiceRoleClient,
  email: string,
  password: string,
  fullName: string,
  isAdmin: boolean
): Promise<string> {
  const created = await serviceRole.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  let userId: string;
  if (created.data.user) {
    userId = created.data.user.id;
  } else {
    const { data, error } = await serviceRole.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const existing = data.users.find((u) => u.email === email);
    if (!existing) {
      throw created.error ?? new Error(`Não foi possível criar nem localizar o usuário ${email}.`);
    }
    userId = existing.id;

    // Re-running this always resets the password to whatever is
    // currently typed into the form, so the test password never goes
    // stale after the first run.
    const { error: pwError } = await serviceRole.auth.admin.updateUserById(userId, { password });
    if (pwError) throw pwError;
  }

  // handle_new_user() already created the profiles row (it fires on
  // every auth.users insert, admin-created or not) - this upsert only
  // ever takes the update path in practice, and only touches id/is_admin.
  // The protect_is_admin_column trigger treats this service-role
  // connection (no end-user JWT, so auth.uid() is null) as trusted, so
  // setting is_admin: true for the test admin goes through.
  const { error: profileError } = await serviceRole
    .from("profiles")
    .upsert({ id: userId, is_admin: isAdmin }, { onConflict: "id" });
  if (profileError) throw profileError;

  return userId;
}

async function ensureTestSubscription(serviceRole: ServiceRoleClient, clientUserId: string) {
  const { error } = await serviceRole.from("subscriptions").upsert(
    {
      user_id: clientUserId,
      plan: "monthly",
      provider_subscription_id: TEST_SUBSCRIPTION_ID,
      status: "authorized",
      amount: 29.9,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider_subscription_id" }
  );
  if (error) throw error;
}

// Never throws. Every step is caught independently so one failing query
// (say, the subscriptions read) can't hide a status the earlier steps
// already resolved successfully - each field just stays at its safe
// default when its own check fails.
export async function getTestAccountsStatus(): Promise<TestAccountsStatus> {
  let serviceRole: ServiceRoleClient;
  try {
    serviceRole = createSupabaseServiceRoleClient();
  } catch (error) {
    logStageError("createSupabaseServiceRoleClient", error);
    return EMPTY_STATUS;
  }

  let adminUser: { id: string } | undefined;
  let clientUser: { id: string } | undefined;
  try {
    const { data, error } = await serviceRole.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    adminUser = data.users.find((u) => u.email === TEST_ADMIN_EMAIL);
    clientUser = data.users.find((u) => u.email === TEST_CLIENT_EMAIL);
  } catch (error) {
    logStageError("listUsers", error);
    return EMPTY_STATUS;
  }

  let adminOk = false;
  if (adminUser) {
    try {
      const { data, error } = await serviceRole
        .from("profiles")
        .select("is_admin")
        .eq("id", adminUser.id)
        .maybeSingle();
      if (error) throw error;
      adminOk = data?.is_admin === true;
    } catch (error) {
      logStageError("read admin profile", error);
    }
  }

  let clienteOk = false;
  let assinaturaOk = false;
  let assinaturaStatus: string | null = null;
  if (clientUser) {
    try {
      const { data, error } = await serviceRole
        .from("profiles")
        .select("is_admin")
        .eq("id", clientUser.id)
        .maybeSingle();
      if (error) throw error;
      clienteOk = data?.is_admin === false;
    } catch (error) {
      logStageError("read client profile", error);
    }

    try {
      const { data, error } = await serviceRole
        .from("subscriptions")
        .select("status")
        .eq("provider_subscription_id", TEST_SUBSCRIPTION_ID)
        .eq("user_id", clientUser.id)
        .maybeSingle();
      if (error) throw error;
      assinaturaStatus = data?.status ?? null;
      assinaturaOk = assinaturaStatus === "authorized";
    } catch (error) {
      logStageError("read test subscription", error);
    }
  }

  return { adminOk, clienteOk, assinaturaOk, assinaturaStatus, unavailable: false };
}

// This one CAN throw - it's only ever called from the Server Actions in
// app/admin/test-accounts-actions.ts, which catch it and convert
// whatever comes out into a single friendly string before it ever
// reaches the client (see the "ações devem retornar erro amigável"
// requirement). logStageError below still records which exact step
// failed for server-side debugging.
export async function prepareTestEnvironment(
  adminPassword: string,
  clientPassword: string
): Promise<TestAccountsStatus> {
  const serviceRole = createSupabaseServiceRoleClient();

  try {
    await ensureTestUser(serviceRole, TEST_ADMIN_EMAIL, adminPassword, "Admin de Teste", true);
  } catch (error) {
    logStageError("ensure admin test user", error);
    throw error;
  }

  let clientUserId: string;
  try {
    clientUserId = await ensureTestUser(serviceRole, TEST_CLIENT_EMAIL, clientPassword, "Cliente de Teste", false);
  } catch (error) {
    logStageError("ensure client test user", error);
    throw error;
  }

  try {
    await ensureTestSubscription(serviceRole, clientUserId);
  } catch (error) {
    logStageError("ensure test subscription", error);
    throw error;
  }

  return getTestAccountsStatus();
}

export async function cancelTestSubscription(): Promise<TestAccountsStatus> {
  const serviceRole = createSupabaseServiceRoleClient();

  const { error } = await serviceRole
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("provider_subscription_id", TEST_SUBSCRIPTION_ID);
  if (error) {
    logStageError("cancel test subscription", error);
    throw error;
  }

  return getTestAccountsStatus();
}
