import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/serviceRole";
import { createPreapproval } from "@/lib/mercadopago";
import { getEffectivePaymentConfig } from "@/lib/paymentConfig";
import { PLANS, isPlanId } from "@/lib/plans";

function mapMpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("card_token") || lower.includes("token")) {
    return "Não foi possível validar o cartão. Confira os dados e tente novamente.";
  }
  if (lower.includes("rejected") || lower.includes("declined") || lower.includes("cc_rejected")) {
    return "Pagamento recusado pela operadora do cartão.";
  }
  return "Não foi possível concluir o pagamento agora. Tente novamente em instantes.";
}

export async function POST(request: NextRequest) {
  let body: { plan?: unknown; cardTokenId?: unknown; payerEmail?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requisição inválida." }, { status: 400 });
  }

  const planId = typeof body.plan === "string" ? body.plan : null;
  const cardTokenId = typeof body.cardTokenId === "string" ? body.cardTokenId : null;
  const payerEmail = typeof body.payerEmail === "string" ? body.payerEmail : null;

  if (!isPlanId(planId) || !cardTokenId || !payerEmail) {
    return NextResponse.json({ message: "Dados de checkout incompletos." }, { status: 400 });
  }

  // The client never gets to say who it's paying for - the session
  // cookie is the only source of truth for user.id (used as Mercado
  // Pago's external_reference).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }

  const { data: existingActive } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "authorized")
    .limit(1)
    .maybeSingle();

  if (existingActive) {
    return NextResponse.json({ message: "Você já tem uma assinatura ativa." }, { status: 409 });
  }

  const plan = PLANS[planId];
  const origin = request.nextUrl.origin;

  const { accessToken } = await getEffectivePaymentConfig();
  if (!accessToken) {
    return NextResponse.json(
      { message: "Pagamentos ainda não configurados. Tente novamente mais tarde." },
      { status: 503 }
    );
  }

  let preapproval;
  try {
    preapproval = await createPreapproval({
      accessToken,
      reason: `MaqAI - Plano ${plan.label}`,
      externalReference: user.id,
      payerEmail,
      cardTokenId,
      amount: plan.amount,
      frequency: plan.frequency,
      frequencyType: plan.frequencyType,
      backUrl: `${origin}/checkout/sucesso`,
      notificationUrl: `${origin}/api/mercadopago/webhook`,
    });
  } catch (error) {
    console.error("Mercado Pago preapproval creation failed:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ message: mapMpError(message) }, { status: 502 });
  }

  try {
    const serviceRole = createSupabaseServiceRoleClient();
    const { error: insertError } = await serviceRole.from("subscriptions").insert({
      user_id: user.id,
      plan: plan.id,
      provider_subscription_id: preapproval.id,
      status: preapproval.status,
      amount: plan.amount,
    });

    if (insertError) throw insertError;
  } catch (error) {
    // The Mercado Pago subscription was created but we failed to record
    // it locally - the webhook will still arrive and can be handled by
    // reconciling manually if this ever happens (logged with the
    // provider id needed to look it up).
    console.error(
      `Failed to persist subscription row for preapproval ${preapproval.id} (user ${user.id}):`,
      error
    );
    return NextResponse.json(
      { message: "Pagamento processado, mas houve um erro ao registrar sua assinatura. Contate o suporte." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
