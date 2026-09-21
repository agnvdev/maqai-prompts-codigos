import Image from "next/image";
import Link from "next/link";

const PLAN_BENEFITS = [
  "Acesso completo à MaqDesk",
  "Prompts e comandos aprovados",
  "Novos conteúdos e atualizações",
  "Cancele quando quiser",
] as const;

export function FinalCta({ imageUrl }: { imageUrl?: string }) {
  return (
    <section className="relative overflow-hidden">
      {imageUrl ? (
        <>
          <Image src={imageUrl} alt="" fill sizes="100vw" className="object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-background/80" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        </>
      ) : (
        <div className="bg-grid pointer-events-none absolute inset-0" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(245,197,24,0.14),transparent_60%)]" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-24">
        <span className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent shadow-card">
          Preço especial de lançamento
        </span>

        <h2 className="text-3xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-4xl">
          Comece a criar com <span className="text-accent">IA</span> agora mesmo
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          Condição exclusiva para os primeiros acessos.
        </p>

        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-card">
          <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
            <span className="text-5xl font-extrabold tracking-tight text-accent sm:text-6xl">
              R$ 29,90
            </span>
            <span className="text-base font-medium text-muted">/mês</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            de <span className="line-through">R$ 79,90/mês</span> no preço regular
          </p>

          <ul className="mt-6 flex flex-col gap-3 text-left">
            {PLAN_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm text-foreground">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                >
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

          <Link
            href="/login"
            className="group relative mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 text-sm font-extrabold uppercase tracking-wide text-accent-foreground shadow-[0_0_0_1px_rgba(245,197,24,0.35),0_20px_40px_-16px_rgba(245,197,24,0.45)] transition-all duration-200 hover:shadow-[0_0_0_1px_rgba(245,197,24,0.5),0_24px_48px_-16px_rgba(245,197,24,0.6)] hover:brightness-105 active:scale-[0.98]"
          >
            Garantir preço de lançamento
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <p className="mt-4 text-xs leading-relaxed text-muted">
            Garanta o valor de R$ 29,90/mês enquanto sua assinatura permanecer ativa.
          </p>
        </div>
      </div>
    </section>
  );
}
