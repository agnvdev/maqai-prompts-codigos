import { getTestAccountsStatus, TEST_ENV_UNAVAILABLE_MESSAGE } from "@/lib/testAccounts";
import { TestAccountsClient } from "@/components/admin/TestAccountsClient";

// The friendly-fallback markup is duplicated here (not imported from
// TestAccountsClient) on purpose: this branch exists specifically for
// the case where something unexpected went wrong, so it must not
// depend on the same component tree that might be implicated. Plain
// server-rendered JSX, no client-side state, nothing that can itself
// fail in a new way. The segment-level error.tsx one level up
// (app/admin/(protected)/settings/error.tsx) has its own copy of this
// same markup for the same reason.
function UnavailableFallback() {
  return (
    <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
      <h1 className="text-lg font-bold text-foreground">{TEST_ENV_UNAVAILABLE_MESSAGE}</h1>
    </div>
  );
}

export default async function AdminTestAccountsPage() {
  // requireAdmin() already ran in the parent (protected) layout.
  //
  // React #441 ("An error occurred in the Server Components render")
  // is what this route showed in production - the actual project lint
  // rule (react-hooks/error-boundaries) caught the real reason a plain
  // try/catch here was never enough: "React does not immediately
  // render components when JSX is constructed, so errors from that
  // component are NOT caught by the try/catch it's constructed in."
  // So this only wraps the async data fetch (the part a try/catch
  // actually can protect) - getTestAccountsStatus() is already
  // designed to never throw on its own (every internal step has its
  // own try/catch, see lib/testAccounts.ts), but this stays as a last
  // line of defense for that specific call. Protecting
  // TestAccountsClient's own render is error.tsx's job, not this
  // function's - that's the only mechanism that actually can.
  let status;
  try {
    status = await getTestAccountsStatus();
  } catch (error) {
    console.error(
      "[test-accounts] getTestAccountsStatus threw unexpectedly:",
      error instanceof Error ? { message: error.message, name: error.name } : String(error)
    );
    return <UnavailableFallback />;
  }

  const loadError = status.unavailable ? TEST_ENV_UNAVAILABLE_MESSAGE : null;
  return <TestAccountsClient initialStatus={status} initialError={loadError} />;
}
