import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/dal";
import { SignOutButton } from "@/components/admin/SignOutButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-6">
        <Link href="/admin" className="text-sm font-bold text-foreground">
          MagAI Admin
        </Link>
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
