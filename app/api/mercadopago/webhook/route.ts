import { NextResponse, type NextRequest } from "next/server";
import { getPreapproval, verifyWebhookSignature } from "@/lib/mercadopago";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/serviceRole";
import { getEffectivePaymentConfig } from "@/lib/paymentConfig";
import type { PlanId } from "@/lib/plans";

// Accepts both notification shapes Mercado Pago has used for
// preapproval events: the current webhook POST body
// ({ type, data: { id } }) and the older IPN query-string form
// (?type=preapproval&data.id=... or ?topic=preapproval&id=...).
async function extractPreapprovalId(request: NextRequest): Promise<{ id: string | null; requestBody: unknown }> {
  const { searchParams } = request.nextUrl;
  const queryId = searchParams.get("data.id") || searchParams.get("id");
  const queryType = searchParams.get("type") || searchParams.get("topic");

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // No JSON body - fine for the query-string IPN shape.
  }

  const bodyRecord = body as { type?: string; data?: { id?: string } } | null;
  const bodyId = bodyRecord?.data?.id ?? null;
  const bodyType = bodyRecord?.type ?? null;

  const type = bodyType || queryType || "";
  if (!type.includes("preapproval")) return { id: null, requestBody: body };

  return { id: bodyId || queryId, requestBody: body };
}

function planFromAutoRecurring(frequency: number | undefined): PlanId {
  return frequency === 12 ? "annual" : "monthly";
}

export async function POST(request: NextRequest) {
  const { id: preapprovalId } = await extractPreapprovalId(request);

  // Not a preapproval event (e.g. a payment notification for something
  // else) or malformed payload - acknowledge so Mercado Pago stops
  // retrying, there's nothing actionable here.
  if (!preapprovalId) {
    return NextResponse.json({ ok: true });
  }

  const { accessToken, webhookSecret } = await getEffectivePaymentConfig();
  const isProduction = process.env.NODE_ENV === "production";

  if (webhookSecret) {
    const valid = verifyWebhookSignature({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId: preapprovalId,
      secret: webhookSecret,
    });
    if (!valid) {
      console.error("Rejected Mercado Pago webhook: invalid signature.");
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
  } else if (isProduction) {
    // A production deployment must not accept unsigned webhook calls -
    // without a secret we cannot tell a real Mercado Pago notification
    // from anyone who discovers this URL and POSTs a guessed/observed
    // preapproval id. Fail closed instead of the old warn-and-continue.
    console.error("Rejected Mercado Pago webhook: no webhook secret configured in production.");
    return NextResponse.json({ message: "Webhook not configured" }, { status: 401 });
  } else {
    console.warn(
      "No webhook secret configured (admin panel or MERCADOPAGO_WEBHOOK_SECRET) - webhook signature is not being verified (non-production only)."
    );
  }

  if (!accessToken) {
    console.error("No Mercado Pago access token configured - cannot verify preapproval status.");
    return NextResponse.json({ message: "Payments not configured" }, { status: 503 });
  }

  // Never trust the payload's own status - always ask Mercado Pago for
  // the current, authoritative state of this preapproval.
  let preapproval;
  try {
    preapproval = await getPreapproval(preapprovalId, accessToken);
  } catch (error) {
    console.error(`Failed to fetch preapproval ${preapprovalId} from Mercado Pago:`, error);
    return NextResponse.json({ message: "Failed to verify subscription" }, { status: 502 });
  }

  const userId = preapproval.external_reference;
  if (!userId) {
    console.error(`Preapproval ${preapprovalId} has no external_reference - cannot map to a user.`);
    return NextResponse.json({ ok: true });
  }

  try {
    const serviceRole = createSupabaseServiceRoleClient();
    // Idempotent by design: upserting on provider_subscription_id with
    // the freshly-fetched status means replaying the same notification
    // (or receiving it out of order) always converges to the same row.
    const { error } = await serviceRole.from("subscriptions").upsert(
      {
        user_id: userId,
        plan: planFromAutoRecurring(preapproval.auto_recurring?.frequency),
        provider_subscription_id: preapproval.id,
        status: preapproval.status,
        amount: preapproval.auto_recurring?.transaction_amount ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider_subscription_id" }
    );
    if (error) throw error;
  } catch (error) {
    console.error(`Failed to persist subscription update for preapproval ${preapprovalId}:`, error);
    return NextResponse.json({ message: "Failed to persist subscription" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Mercado Pago's dashboard "simulate" button and some notification
// configurations send a GET - respond the same way as POST so
// configuration testing doesn't fail with 405.
export async function GET(request: NextRequest) {
  return POST(request);
}
