import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/ui/Brand";

// Shared premium shell for every customer-facing auth page (/login,
// /cadastro, /recuperar-senha, /redefinir-senha) — same dark/grid/glow
// treatment as Hero.tsx, so these never read as a generic auth-library
// screen. Deliberately not reused by /admin/login (kept fully separate
// per the "don't mix admin and customer auth UI" instruction).
export function AuthShell({
  title,
  subtitle,
  logoUrl,
  children,
}: {
  title: string;
  subtitle?: string;
  logoUrl?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,197,24,0.12),transparent_60%)]" />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <Link href="/">
          <Brand logoUrl={logoUrl} />
        </Link>

        <div className="flex w-full flex-col gap-1.5 text-center">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>

        <div className="w-full rounded-2xl border border-border bg-surface p-6 shadow-card">{children}</div>
      </div>
    </div>
  );
}
