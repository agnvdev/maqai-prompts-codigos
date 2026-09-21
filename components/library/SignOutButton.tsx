"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Deliberately a separate component from components/admin/SignOutButton
// (same idea, different redirect target) rather than a shared one with
// a prop - keeps customer and admin auth UI fully independent, so a
// change here can never accidentally touch /admin.
export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-xs font-medium text-muted transition-colors duration-200 hover:text-foreground"
    >
      Sair
    </button>
  );
}
