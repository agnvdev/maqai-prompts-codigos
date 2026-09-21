"use client";

import { useState } from "react";
import { savePaymentSettingsAction } from "@/app/admin/payment-settings-actions";

function StatusBadge({ label, configured }: { label: string; configured: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
        configured ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-muted"
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${configured ? "bg-accent" : "bg-muted"}`} />
      {label}: {configured ? "Configurado" : "Não configurado"}
    </div>
  );
}

function SecretField({
  name,
  label,
  masked,
  type = "password",
  helpText,
}: {
  name: string;
  label: string;
  masked: string | null;
  type?: "text" | "password";
  helpText?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
      {label}
      <span className="text-[11px] font-normal text-muted">
        Atual: {masked ? <span className="font-mono text-foreground">{masked}</span> : "não configurado"}
      </span>
      <input
        type={type}
        name={name}
        autoComplete="off"
        placeholder="Deixe em branco para manter o valor atual"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
      />
      {helpText && <span className="text-[11px] font-normal text-muted">{helpText}</span>}
    </label>
  );
}

export function PaymentSettingsClient({
  maskedPublicKey,
  maskedAccessToken,
  maskedWebhookSecret,
  mercadoPagoConfigured,
  webhookConfigured,
}: {
  maskedPublicKey: string | null;
  maskedAccessToken: string | null;
  maskedWebhookSecret: string | null;
  mercadoPagoConfigured: boolean;
  webhookConfigured: boolean;
}) {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-foreground">Pagamentos (Mercado Pago)</h1>
        <p className="text-xs text-muted">
          Credenciais usadas pelo checkout e pelo webhook de assinaturas. Os segredos nunca são
          exibidos por completo aqui - só os últimos 4 caracteres, para confirmar qual valor está
          salvo. Se um campo estiver em branco no envio, o valor atual é mantido.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatusBadge label="Mercado Pago" configured={mercadoPagoConfigured} />
        <StatusBadge label="Webhook" configured={webhookConfigured} />
      </div>

      <form
        action={async (formData) => {
          setSaving(true);
          setStatus(null);
          try {
            await savePaymentSettingsAction(formData);
            setStatus({ type: "success", message: "Configurações salvas." });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Não foi possível salvar agora.";
            setStatus({ type: "error", message });
          } finally {
            setSaving(false);
          }
        }}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
      >
        <SecretField
          name="public_key"
          label="Public Key"
          masked={maskedPublicKey}
          type="text"
          helpText="Usada no navegador do cliente para tokenizar o cartão - não é secreta."
        />
        <SecretField
          name="access_token"
          label="Access Token"
          masked={maskedAccessToken}
          helpText="Secreta. Usada só no servidor, nunca enviada ao navegador."
        />
        <SecretField
          name="webhook_secret"
          label="Webhook Secret"
          masked={maskedWebhookSecret}
          helpText="Secreta. Valida as notificações recebidas do Mercado Pago."
        />

        {status && (
          <p className={`text-xs ${status.type === "success" ? "text-accent" : "text-red-400"}`}>
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
    </div>
  );
}
