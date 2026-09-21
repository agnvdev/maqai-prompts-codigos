import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Showcase } from "@/components/landing/Showcase";
import { Footer } from "@/components/landing/Footer";
import { PricingCard } from "@/components/landing/PricingCard";
import { CtaButton } from "@/components/landing/CtaButton";
import { getActiveLpMediaMap } from "@/lib/supabase/lpMedia";
import { getActiveLpBeforeAfterPairs, type LpBeforeAfterPair } from "@/lib/supabase/lpBeforeAfter";
import { getActiveLpShowcaseItems, type LpShowcaseItem } from "@/lib/supabase/lpShowcase";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Plano MaqDesk - R$ 29,90/mês",
  description:
    "Assine a MaqDesk por R$ 29,90/mês no lançamento. Biblioteca premium de prompts para máquinas pesadas, agro e equipamentos pesados.",
};

export default async function PlanoPage() {
  let logoMedia: Record<string, string> = {};
  let beforeAfterPairs: LpBeforeAfterPair[] = [];
  let showcaseItems: LpShowcaseItem[] = [];

  try {
    logoMedia = await getActiveLpMediaMap("logo");
  } catch (error) {
    console.error("Failed to load LP media from Supabase:", error);
  }

  try {
    // Same source as the Home page's Antes/Depois section - no separate
    // table or media, just reusing the existing query.
    beforeAfterPairs = await getActiveLpBeforeAfterPairs();
  } catch (error) {
    console.error("Failed to load before/after pairs from Supabase:", error);
  }

  try {
    // Same source as the Home page's Mostruário section.
    showcaseItems = await getActiveLpShowcaseItems();
  } catch (error) {
    console.error("Failed to load showcase items from Supabase:", error);
  }

  return (
    <>
      <Header logoUrl={logoMedia.Logo} />
      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden border-b border-border">
          <div className="bg-grid pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,197,24,0.16),transparent_60%)]" />

          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24">
            <span className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent shadow-card">
              Preço especial de lançamento
            </span>

            <h1 className="text-3xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-4xl">
              Assine a <span className="text-accent">MaqDesk</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Biblioteca premium de prompts, códigos e combinações para máquinas pesadas, agro e
              equipamentos pesados.
            </p>

            <PricingCard ctaLabel="Assinar MaqDesk" ctaHref="/login" />
          </div>
        </section>

        {(beforeAfterPairs.length > 0 || showcaseItems.length > 0) && (
          <div className="mx-auto max-w-5xl px-4 pt-16 text-center sm:px-6 sm:pt-20">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Veja alguns exemplos
            </h2>
          </div>
        )}
        <BeforeAfter pairs={beforeAfterPairs} />
        <Showcase items={showcaseItems} />

        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(245,197,24,0.14),transparent_60%)]" />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-24">
            <h2 className="text-3xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-4xl">
              Pronto para começar?
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Garanta o preço de lançamento antes que ele acabe.
            </p>
            <CtaButton href="/login" label="Assinar MaqDesk" />
          </div>
        </section>
      </main>
      <Footer logoUrl={logoMedia.Logo} />
    </>
  );
}
