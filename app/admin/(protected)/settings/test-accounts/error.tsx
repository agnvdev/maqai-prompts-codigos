"use client";

import { useEffect } from "react";
import { TEST_ENV_UNAVAILABLE_MESSAGE } from "@/lib/testAccountsConstants";

// Last-resort safety net for this route segment: page.tsx and
// lib/testAccounts.ts already catch everything they know how to fail
// (service role missing, listUsers, profile/subscription reads), so
// this should rarely if ever fire - but without it, anything that DID
// slip through (or a bug in TestAccountsClient's own render) would
// unmount the whole tree and show a bare, unhelpful crash instead of a
// message an admin can act on. Same visual language as the "Acesso
// negado" card in the parent layout.
export default function TestAccountsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // In production `error.message` is already a generic, redacted
    // string (Next.js strips Server Component error details before
    // this reaches the client) - `error.digest` is what actually
    // correlates back to the real error in server-side logs.
    console.error("[test-accounts] error boundary caught:", error.message, "digest:", error.digest);
  }, [error]);

  return (
    <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
      <h1 className="text-lg font-bold text-foreground">{TEST_ENV_UNAVAILABLE_MESSAGE}</h1>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-accent/50"
      >
        Tentar novamente
      </button>
    </div>
  );
}
