import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { PlanBenefitsList } from "@/components/landing/PlanBenefitsList";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getCustomerAuthState } from "@/lib/supabase/customerDal";
import { getSafeRedirect } from "@/lib/safeRedirect";
import { PLANS, isPlanId } from "@/lib/plans";
import { getActiveLpMediaMap } from "@/lib/supabase/lpMedia";
import { HERO_IMAGE } from "@/lib/images";

export const metadata: Metadata = {
  title: "Checkout - MaqDesk",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const planParam = typeof params.plan === "string" ? params.plan : null;

  if (!isPlanId(planParam)) {
    redirect("/plano");
  }
  const plan = PLANS[planParam];

  const currentPath = `/checkout?plan=${planParam}`;

  const auth = await getCustomerAuthState();
  if (auth.status === "unauthenticated") {
    redirect(`/login?redirect=${encodeURIComponent(getSafeRedirect(currentPath))}`);
  }
  if (auth.status === "authenticated") {
    // Already has an active subscription - nothing to check out.
    redirect("/app");
  }

  let heroMedia: Record<string, string> = {};
  let logoMedia: Record<string, string> = {};
  try {
    [heroMedia, logoMedia] = await Promise.all([
      getActiveLpMediaMap("hero"),
      getActiveLpMediaMap("logo"),
    ]);
  } catch (error) {
    console.error("Failed to load LP media from Supabase:", error);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border px-4 py-3.5 sm:px-6">
        <Brand logoUrl={logoMedia.Logo} />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:flex-row lg:gap-12">
        <section className="flex flex-1 flex-col gap-6">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border shadow-card">
            <Image src={heroMedia.hero || HERO_IMAGE} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">
              Plano {plan.label}
            </span>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-4xl font-extrabold tracking-tight text-accent">{plan.priceLabel}</span>
              <span className="text-sm font-medium text-muted">{plan.id === "annual" ? "/ano" : "/mês"}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{plan.billingNote}</p>

            <PlanBenefitsList className="mt-6" />
          </div>
        </section>

        <section className="flex-1 rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Finalizar assinatura</h1>
          <p className="mt-1 text-sm text-muted">Pagamento com cartão de crédito, processado pelo Mercado Pago.</p>

          <div className="mt-6">
            <CheckoutForm plan={plan} userEmail={auth.user.email} userName={auth.user.fullName} />
          </div>
        </section>
      </main>
    </div>
  );
}
