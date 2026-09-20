import Link from "next/link";
import { Brand } from "@/components/ui/Brand";

export function Header({ logoUrl }: { logoUrl?: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Brand logoUrl={logoUrl} />
        <Link
          href="/app"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
        >
          Acessar
        </Link>
      </div>
    </header>
  );
}
