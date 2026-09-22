import {
  getTestAccountsStatus,
  TEST_ENV_UNAVAILABLE_MESSAGE,
  type TestAccountsStatus,
} from "@/lib/testAccounts";
import { TestAccountsClient } from "@/components/admin/TestAccountsClient";

const FALLBACK_STATUS: TestAccountsStatus = {
  adminOk: false,
  clienteOk: false,
  assinaturaOk: false,
  assinaturaStatus: null,
  unavailable: true,
};

export default async function AdminTestAccountsPage() {
  // requireAdmin() already ran in the parent (protected) layout.
  //
  // getTestAccountsStatus() is designed to never throw (every internal
  // step has its own try/catch - see lib/testAccounts.ts), but this
  // stays wrapped anyway as a last line of defense: if it ever does
  // throw despite that, the page still renders the friendly message
  // instead of crashing. app/admin/(protected)/settings/test-accounts/error.tsx
  // is the outer safety net for anything neither of these catches (e.g.
  // a genuine bug in TestAccountsClient's own render).
  let status: TestAccountsStatus = FALLBACK_STATUS;
  let loadError: string | null = null;

  try {
    status = await getTestAccountsStatus();
    if (status.unavailable) {
      loadError = TEST_ENV_UNAVAILABLE_MESSAGE;
    }
  } catch (error) {
    console.error(
      "[test-accounts] unexpected failure loading status:",
      error instanceof Error ? error.message : String(error)
    );
    loadError = TEST_ENV_UNAVAILABLE_MESSAGE;
  }

  return <TestAccountsClient initialStatus={status} initialError={loadError} />;
}
