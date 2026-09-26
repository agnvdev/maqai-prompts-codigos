import Image from "next/image";
import { PricingCard } from "@/components/landing/PricingCard";

export function FinalCta({
  imageUrl,
  mobileImageUrl,
}: {
  imageUrl?: string;
  mobileImageUrl?: string;
}) {
  // Falls back to the desktop image when no mobile-specific one is set -
  // see OPER "Regra mobile-first MaqAI".
  const mobileSrc = mobileImageUrl || imageUrl;

  return (
    <section className="relative overflow-hidden">
      {imageUrl ? (
        <>
          {mobileSrc && <Image src={mobileSrc} alt="" fill sizes="100vw" className="object-cover sm:hidden" />}
          <Image src={imageUrl} alt="" fill sizes="100vw" className="hidden object-cover sm:block" />
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

        <PricingCard ctaLabel="Garantir preço de lançamento" ctaHref="/plano" />
      </div>
    </section>
  );
}
