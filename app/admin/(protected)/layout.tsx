import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminAuthState } from "@/lib/supabase/dal";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { AdminHeader } from "@/components/admin/AdminHeader";

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
      <AdminHeader email={admin.email} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
