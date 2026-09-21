import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { getActiveLpMediaMap } from "@/lib/supabase/lpMedia";

export const metadata: Metadata = {
  title: "Assinatura confirmada - MaqDesk",
};

export default async function CheckoutSucessoPage() {
  let logoMedia: Record<string, string> = {};
  try {
    logoMedia = await getActiveLpMediaMap("logo");
  } catch (error) {
    console.error("Failed to load logo media from Supabase:", error);
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,197,24,0.14),transparent_60%)]" />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Brand logoUrl={logoMedia.Logo} />

        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-surface text-accent shadow-card">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Assinatura confirmada</h1>
          <p className="text-sm text-muted">
            Seu pagamento foi aprovado. Sua assinatura MaqDesk já está ativa.
          </p>
        </div>

        <Link
          href="/app"
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-accent px-8 py-4 text-sm font-extrabold uppercase tracking-wide text-accent-foreground shadow-[0_0_0_1px_rgba(245,197,24,0.35),0_20px_40px_-16px_rgba(245,197,24,0.45)] transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
        >
          Entrar na MaqDesk
        </Link>
      </div>
    </div>
  );
}
