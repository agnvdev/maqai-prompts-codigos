"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const DEFAULT_CLASSNAME = "text-xs font-medium text-muted transition-colors hover:text-foreground";

// className is optional purely for layout reuse (e.g. AdminHeader styles
// this as a full menu row on mobile and a bordered pill on desktop) - the
// sign-out action/behavior below is unchanged either way.
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} className={className ?? DEFAULT_CLASSNAME}>
      Sair
    </button>
  );
}
