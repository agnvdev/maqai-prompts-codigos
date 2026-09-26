import { CtaButton } from "@/components/landing/CtaButton";
import { PlanBenefitsList } from "@/components/landing/PlanBenefitsList";

export function PricingCard({ ctaLabel, ctaHref }: { ctaLabel: string; ctaHref: string }) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
        <span className="text-5xl font-extrabold tracking-tight text-accent sm:text-6xl">R$ 29,90</span>
        <span className="text-base font-medium text-muted">/mês</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        de <span className="line-through">R$ 79,90/mês</span> no preço regular
      </p>
      <p className="mt-2 text-sm font-semibold text-accent">
        Condição exclusiva para os primeiros acessos.
      </p>

      <PlanBenefitsList className="mt-6" />

      <CtaButton href={ctaHref} label={ctaLabel} fullWidth className="mt-7" />

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Garanta o valor de R$ 29,90/mês enquanto sua assinatura permanecer ativa.
      </p>
    </div>
  );
}
