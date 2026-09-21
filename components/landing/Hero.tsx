import Image from "next/image";
import Link from "next/link";
import { HERO_IMAGE } from "@/lib/images";

export function Hero({ imageUrl }: { imageUrl?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <Image
        src={imageUrl || HERO_IMAGE}
        alt="Máquina pesada em operação em cenário industrial"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-background/70" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,197,24,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
        <span className="animate-fade-up rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent shadow-card">
          Plataforma de IA para o setor pesado.
        </span>

        <h1
          className="animate-fade-up text-2xl font-bold uppercase leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-6xl lg:leading-[1.05]"
          style={{ animationDelay: "80ms" }}
        >
          Prompts e comandos
          <br />
          aprovados para
          <br />
          <span className="text-accent">equipamentos pesados</span>
        </h1>

        <p
          className="animate-fade-up max-w-2xl text-balance text-base leading-relaxed text-muted sm:text-lg"
          style={{ animationDelay: "140ms" }}
        >
          Uma biblioteca premium de prompts, códigos e combinações para máquinas pesadas, agro e
          equipamentos pesados.
        </p>

        <Link
          href="/login"
          className="animate-fade-up group relative mt-2 inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-sm font-extrabold uppercase tracking-wide text-accent-foreground shadow-[0_0_0_1px_rgba(245,197,24,0.35),0_20px_40px_-16px_rgba(245,197,24,0.45)] transition-all duration-200 hover:shadow-[0_0_0_1px_rgba(245,197,24,0.5),0_24px_48px_-16px_rgba(245,197,24,0.6)] hover:brightness-105 active:scale-[0.98] sm:text-base"
          style={{ animationDelay: "200ms" }}
        >
          Acessar a MaqDesk - R$ 29,90/mês
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
      </div>
    </section>
  );
}
