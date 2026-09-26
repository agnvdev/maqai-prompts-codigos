"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/admin/SignOutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Prompts" },
  { href: "/admin/media", label: "Mídias da LP" },
  { href: "/admin/settings/payments", label: "Pagamentos" },
  { href: "/admin/settings/test-accounts", label: "Contas de teste" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

// Dashboard-style nav only from lg (1024px) up - below that (including
// 768px tablet width) the 4 labels + email + sign-out would not fit on
// one line, so the compact mobile header (logo + Menu) covers every
// width from 375 up to lg, not just phone widths.
export function AdminHeader({ email }: { email: string | null }) {
  const displayEmail = email ?? "Administrador";
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/admin" className="shrink-0 text-sm font-bold text-foreground">
          MaqAI <span className="text-accent">Admin</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
                  active ? "bg-surface-2 text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <span className="max-w-[180px] truncate text-xs text-muted">{displayEmail}</span>
          <SignOutButton className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted transition-colors duration-200 hover:border-border/80 hover:text-foreground" />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-colors duration-200 active:scale-[0.97] lg:hidden"
        >
          Menu
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-surface px-4 py-3 sm:px-6 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-3 text-sm font-semibold transition-colors duration-200 active:scale-[0.98] ${
                    active ? "bg-surface-2 text-accent" : "text-foreground hover:bg-surface-2"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="truncate text-[11px] text-muted">{displayEmail}</span>
            <SignOutButton
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-2 active:scale-[0.98]"
            />
          </div>
        </div>
      )}
    </header>
  );
}
