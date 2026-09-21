import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminAuthState } from "@/lib/supabase/dal";
import { SignOutButton } from "@/components/admin/SignOutButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await getAdminAuthState();

  if (auth.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (auth.status === "forbidden") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
          <h1 className="text-lg font-bold text-foreground">Acesso negado</h1>
          <p className="text-sm text-muted">
            Sua conta está autenticada, mas não tem permissão de administrador no MaqAI.
          </p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  const admin = auth.user;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm font-bold text-foreground">
            MaqAI Admin
          </Link>
          <nav className="flex items-center gap-3 text-xs font-medium text-muted">
            <Link href="/admin" className="transition-colors hover:text-foreground">
              Prompts
            </Link>
            <Link href="/admin/media" className="transition-colors hover:text-foreground">
              Mídias da LP
            </Link>
            <Link href="/admin/settings/payments" className="transition-colors hover:text-foreground">
              Pagamentos
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{admin.email}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
