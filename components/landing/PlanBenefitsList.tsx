export const PLAN_BENEFITS = [
  "Acesso completo à MaqAI",
  "Prompts e comandos aprovados",
  "Novos conteúdos e atualizações",
  "Cancele quando quiser",
] as const;

export function PlanBenefitsList({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-col gap-3 text-left ${className}`}>
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
  );
}
