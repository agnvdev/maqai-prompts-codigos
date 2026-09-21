import { CtaButton } from "@/components/landing/CtaButton";
import type { Plan } from "@/lib/plans";

export function PlanCard({ plan, highlighted = false }: { plan: Plan; highlighted?: boolean }) {
  return (
    <div
      className={`relative flex w-full flex-col items-center gap-4 rounded-2xl border p-8 text-center shadow-card ${
        highlighted ? "border-accent bg-surface" : "border-border bg-surface/60"
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground shadow-card">
          {plan.badge}
        </span>
      )}

      <span className="text-xs font-semibold uppercase tracking-widest text-muted">{plan.label}</span>

      <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
        <span className="text-4xl font-extrabold tracking-tight text-accent sm:text-5xl">
          {plan.priceLabel}
        </span>
        <span className="text-sm font-medium text-muted">
          {plan.id === "annual" ? "/ano" : "/mês"}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-muted">{plan.billingNote}</p>

      <CtaButton
        href={`/checkout?plan=${plan.id}`}
        label={`Assinar plano ${plan.label.toLowerCase()}`}
        fullWidth
        className="mt-2"
      />
    </div>
  );
}
