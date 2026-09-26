import Image from "next/image";
import { HERO_IMAGE } from "@/lib/images";
import { CtaButton } from "@/components/landing/CtaButton";

export function Hero({
  imageUrl,
  mobileImageUrl,
}: {
  imageUrl?: string;
  mobileImageUrl?: string;
}) {
  const desktopSrc = imageUrl || HERO_IMAGE;
  // Falls back to the desktop image when no mobile-specific one is set -
  // see OPER "Regra mobile-first MaqAI" (mobile art-direction with a
  // desktop fallback, not a hard requirement to upload both).
  const mobileSrc = mobileImageUrl || desktopSrc;

  return (
    <section className="relative overflow-hidden border-b border-border">
      <Image
        src={mobileSrc}
        alt="Máquina pesada em operação em cenário industrial"
        fill
        priority
        sizes="100vw"
        className="object-cover sm:hidden"
      />
      <Image
        src={desktopSrc}
        alt="Máquina pesada em operação em cenário industrial"
        fill
        priority
        sizes="100vw"
        className="hidden object-cover sm:block"
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

        <CtaButton
          href="/plano"
          label="Começar por R$ 29,90/mês"
          className="animate-fade-up mt-2"
          style={{ animationDelay: "200ms" }}
        />
      </div>
    </section>
  );
}
