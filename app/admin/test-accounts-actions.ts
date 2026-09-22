"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { prepareTestEnvironment, cancelTestSubscription, type TestAccountsStatus } from "@/lib/testAccounts";

// Same admin-write pattern as actions.ts/payment-settings-actions.ts:
// requireAdmin() first, every time - this is the only gate, since the
// actual work below runs through the service-role client and would
// otherwise happen unchecked for anyone who could call this action.
export async function prepareTestEnvironmentAction(formData: FormData): Promise<TestAccountsStatus> {
  await requireAdmin();

  const adminPassword = formData.get("admin_password")?.toString() ?? "";
  const clientPassword = formData.get("client_password")?.toString() ?? "";

  if (adminPassword.length < 6 || clientPassword.length < 6) {
    throw new Error("As senhas de teste precisam ter pelo menos 6 caracteres.");
  }

  const status = await prepareTestEnvironment(adminPassword, clientPassword);
  revalidatePath("/admin/settings/test-accounts");
  return status;
}

export async function cancelTestSubscriptionAction(): Promise<TestAccountsStatus> {
  await requireAdmin();

  const status = await cancelTestSubscription();
  revalidatePath("/admin/settings/test-accounts");
  return status;
}
