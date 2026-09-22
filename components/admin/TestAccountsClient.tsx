"use client";

import { useState } from "react";
import {
  prepareTestEnvironmentAction,
  cancelTestSubscriptionAction,
} from "@/app/admin/test-accounts-actions";
import type { TestAccountsStatus } from "@/lib/testAccounts";
import { TEST_ADMIN_EMAIL, TEST_CLIENT_EMAIL } from "@/lib/testAccountsConstants";

function StatusBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
        ok ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-muted"
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? "bg-accent" : "bg-muted"}`} />
      {label}: {ok ? "OK" : "Pendente"}
    </div>
  );
}

export function TestAccountsClient({
  initialStatus,
  initialError,
}: {
  initialStatus: TestAccountsStatus;
  initialError: string | null;
}) {
  const [status, setStatus] = useState<TestAccountsStatus>(initialStatus);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    initialError ? { type: "error", text: initialError } : null
  );
  const [preparing, setPreparing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handlePrepare(formData: FormData) {
    setPreparing(true);
    setMessage(null);
    try {
      const result = await prepareTestEnvironmentAction(formData);
      setStatus(result);
      setMessage({ type: "success", text: "Ambiente de teste preparado." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível preparar o ambiente de teste.",
      });
    } finally {
      setPreparing(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setMessage(null);
    try {
      const result = await cancelTestSubscriptionAction();
      setStatus(result);
      setMessage({ type: "success", text: "Assinatura de teste cancelada." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível cancelar a assinatura de teste.",
      });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-foreground">Contas de teste</h1>
        <p className="text-xs text-muted">
          Cria/garante 2 contas fixas para testar o fluxo completo sem usar dados reais: um admin (
          <span className="font-mono">{TEST_ADMIN_EMAIL}</span>) e um cliente com assinatura ativa (
          <span className="font-mono">{TEST_CLIENT_EMAIL}</span>). Rodar de novo não duplica nada - só
          garante que o estado continua correto.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatusBadge label="Admin" ok={status.adminOk} />
        <StatusBadge label="Cliente" ok={status.clienteOk} />
        <StatusBadge label="Assinatura" ok={status.assinaturaOk} />
      </div>

      {status.assinaturaStatus && (
        <p className="text-xs text-muted">
          Status atual da assinatura de teste: <span className="font-mono">{status.assinaturaStatus}</span>
        </p>
      )}

      <form
        action={handlePrepare}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
      >
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          Senha do admin de teste
          <input
            type="password"
            name="admin_password"
            required
            minLength={6}
            autoComplete="off"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          Senha do cliente de teste
          <input
            type="password"
            name="client_password"
            required
            minLength={6}
            autoComplete="off"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>

        <button
          type="submit"
          disabled={preparing}
          className="self-start rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground disabled:opacity-60"
        >
          {preparing ? "Preparando..." : "Preparar ambiente de teste"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleCancel}
        disabled={cancelling}
        className="self-start rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-accent/50 disabled:opacity-60"
      >
        {cancelling ? "Cancelando..." : "Cancelar assinatura teste"}
      </button>

      {message && (
        <p className={`text-xs ${message.type === "success" ? "text-accent" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
