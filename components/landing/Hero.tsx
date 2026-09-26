import { getImageProps } from "next/image";
import { HERO_IMAGE } from "@/lib/images";
import { CtaButton } from "@/components/landing/CtaButton";

// Native <picture>/<source> instead of <Image>: two next/image elements
// toggled with sm:hidden/hidden sm:block still both get requested by the
// browser (priority images skip the "don't fetch display:none"
// heuristic), so the mobile-vs-desktop split was fetching both variants
// on every load. <picture> lets the browser itself pick exactly one
// <source> before any request is made, and its native "no matching
// <source> -> fall through to <img>" behavior *is* the mobile-missing-
// falls-back-to-desktop rule, with no JS needed for it.
//
// getImageProps (next/image's own escape hatch for exactly this - see
// https://nextjs.org/docs/app/api-reference/components/image#getimageprops)
// still runs every src through Next's real image optimizer/loader, so
// each <source>/<img> gets a real responsive srcSet - only the
// rendering (<picture> instead of <Image>) is manual, not the URLs.
const ALT_TEXT = "Máquina pesada em operação em cenário industrial";

export function Hero({
  imageUrl,
  mobileImageUrl,
}: {
  imageUrl?: string;
  mobileImageUrl?: string;
}) {
  const desktopSrc = imageUrl || HERO_IMAGE;
  const common = {
    alt: ALT_TEXT,
    fill: true as const,
    sizes: "100vw",
    fetchPriority: "high" as const,
    priority: true,
    style: { objectFit: "cover" as const },
  };

  const mobile = mobileImageUrl ? getImageProps({ ...common, src: mobileImageUrl }) : null;
  const { props: desktopProps } = getImageProps({ ...common, src: desktopSrc });

  return (
    <section className="relative overflow-hidden border-b border-border">
      <picture className="contents">
        {mobile && <source media="(max-width: 639px)" srcSet={mobile.props.srcSet} sizes={mobile.props.sizes} />}
        <img {...desktopProps} alt={ALT_TEXT} />
      </picture>
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
