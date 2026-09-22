import { getTestAccountsStatus, type TestAccountsStatus } from "@/lib/testAccounts";
import { TestAccountsClient } from "@/components/admin/TestAccountsClient";

export default async function AdminTestAccountsPage() {
  // requireAdmin() already ran in the parent (protected) layout.
  let status: TestAccountsStatus | null = null;
  let loadError: string | null = null;

  try {
    status = await getTestAccountsStatus();
  } catch (error) {
    console.error("Failed to load test accounts status:", error);
    loadError =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar o status das contas de teste agora.";
  }

  return <TestAccountsClient initialStatus={status} initialError={loadError} />;
}
