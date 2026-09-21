import { createHmac } from "node:crypto";

const MP_API_BASE = "https://api.mercadopago.com";

function requireAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return token;
}

export interface MpPreapproval {
  id: string;
  status: string;
  external_reference?: string;
  auto_recurring?: {
    frequency: number;
    frequency_type: string;
    transaction_amount: number;
  };
}

export interface CreatePreapprovalInput {
  reason: string;
  externalReference: string;
  payerEmail: string;
  cardTokenId: string;
  amount: number;
  frequency: number;
  frequencyType: "months";
  backUrl: string;
  notificationUrl: string;
}

// Creates the recurring subscription directly from a client-side card
// token - no redirect through Mercado Pago's own checkout page. Throws
// with MP's own message on failure (declined card, invalid token, etc.)
// so the route handler can translate it into a friendly PT-BR message.
export async function createPreapproval(input: CreatePreapprovalInput): Promise<MpPreapproval> {
  const res = await fetch(`${MP_API_BASE}/preapproval`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireAccessToken()}`,
    },
    body: JSON.stringify({
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      card_token_id: input.cardTokenId,
      back_url: input.backUrl,
      notification_url: input.notificationUrl,
      auto_recurring: {
        frequency: input.frequency,
        frequency_type: input.frequencyType,
        transaction_amount: input.amount,
        currency_id: "BRL",
      },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || "Não foi possível criar a assinatura no Mercado Pago.";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data as MpPreapproval;
}

// The webhook must never trust the status embedded in the notification
// payload - it only exists to tell us *something* changed for this id,
// then we ask Mercado Pago directly what the real current status is.
export async function getPreapproval(id: string): Promise<MpPreapproval> {
  const res = await fetch(`${MP_API_BASE}/preapproval/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${requireAccessToken()}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.message) || "Não foi possível consultar a assinatura no Mercado Pago.");
  }
  return data as MpPreapproval;
}

// Validates the `x-signature` header Mercado Pago sends on webhook
// deliveries (HMAC-SHA256 over "id:<data.id>;request-id:<x-request-id>;
// ts:<ts>;", per MP's documented scheme). Only enforced when
// MERCADOPAGO_WEBHOOK_SECRET is configured - see the final report for
// where to get that secret and why an unconfigured webhook still works
// (but unverified) until then.
export function verifyWebhookSignature({
  xSignature,
  xRequestId,
  dataId,
  secret,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  if (!xSignature) return false;

  const parts: Record<string, string> = {};
  for (const pair of xSignature.split(",")) {
    const [key, value] = pair.split("=").map((s) => s?.trim());
    if (key && value) parts[key] = value;
  }

  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${dataId.toLowerCase()};${xRequestId ? `request-id:${xRequestId};` : ""}ts:${ts};`;
  const computed = createHmac("sha256", secret).update(manifest).digest("hex");
  return computed === hash;
}
