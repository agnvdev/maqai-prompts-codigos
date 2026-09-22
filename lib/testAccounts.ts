import { createSupabaseServiceRoleClient } from "@/lib/supabase/serviceRole";

// Fixed, well-known identities - the whole point is that re-running
// "Preparar ambiente de teste" always converges on the same 2 users and
// the same 1 subscription row instead of piling up duplicates. Real
// users never have a @maqai.local address, so there is no realistic
// collision with production accounts.
export const TEST_ADMIN_EMAIL = "admin.teste@maqai.local";
export const TEST_CLIENT_EMAIL = "cliente.teste@maqai.local";
export const TEST_SUBSCRIPTION_ID = "manual_test_cliente_001";

export interface TestAccountsStatus {
  adminOk: boolean;
  clienteOk: boolean;
  assinaturaOk: boolean;
  assinaturaStatus: string | null;
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

export async function getTestAccountsStatus(): Promise<TestAccountsStatus> {
  const serviceRole = createSupabaseServiceRoleClient();

  const { data: usersPage, error: listError } = await serviceRole.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  const adminUser = usersPage.users.find((u) => u.email === TEST_ADMIN_EMAIL);
  const clientUser = usersPage.users.find((u) => u.email === TEST_CLIENT_EMAIL);

  let adminOk = false;
  if (adminUser) {
    const { data } = await serviceRole.from("profiles").select("is_admin").eq("id", adminUser.id).maybeSingle();
    adminOk = data?.is_admin === true;
  }

  let clienteOk = false;
  let assinaturaOk = false;
  let assinaturaStatus: string | null = null;
  if (clientUser) {
    const { data } = await serviceRole.from("profiles").select("is_admin").eq("id", clientUser.id).maybeSingle();
    clienteOk = data?.is_admin === false;

    const { data: sub } = await serviceRole
      .from("subscriptions")
      .select("status")
      .eq("provider_subscription_id", TEST_SUBSCRIPTION_ID)
      .eq("user_id", clientUser.id)
      .maybeSingle();
    assinaturaStatus = sub?.status ?? null;
    assinaturaOk = assinaturaStatus === "authorized";
  }

  return { adminOk, clienteOk, assinaturaOk, assinaturaStatus };
}

export async function prepareTestEnvironment(
  adminPassword: string,
  clientPassword: string
): Promise<TestAccountsStatus> {
  const serviceRole = createSupabaseServiceRoleClient();

  await ensureTestUser(serviceRole, TEST_ADMIN_EMAIL, adminPassword, "Admin de Teste", true);
  const clientUserId = await ensureTestUser(
    serviceRole,
    TEST_CLIENT_EMAIL,
    clientPassword,
    "Cliente de Teste",
    false
  );
  await ensureTestSubscription(serviceRole, clientUserId);

  return getTestAccountsStatus();
}

export async function cancelTestSubscription(): Promise<TestAccountsStatus> {
  const serviceRole = createSupabaseServiceRoleClient();

  const { error } = await serviceRole
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("provider_subscription_id", TEST_SUBSCRIPTION_ID);
  if (error) throw error;

  return getTestAccountsStatus();
}
