import { CtaButton } from "@/components/landing/CtaButton";

const PLAN_BENEFITS = [
  "Acesso completo à MaqDesk",
  "Prompts e comandos aprovados",
  "Novos conteúdos e atualizações",
  "Cancele quando quiser",
] as const;

export function PricingCard({ ctaLabel, ctaHref }: { ctaLabel: string; ctaHref: string }) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-card">
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

      <ul className="mt-6 flex flex-col gap-3 text-left">
        {PLAN_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5 text-sm text-foreground">
            <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {benefit}
          </li>
        ))}
      </ul>

      <CtaButton href={ctaHref} label={ctaLabel} fullWidth className="mt-7" />

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Garanta o valor de R$ 29,90/mês enquanto sua assinatura permanecer ativa.
      </p>
    </div>
  );
}
