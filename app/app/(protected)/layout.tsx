import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCustomerAuthState } from "@/lib/supabase/customerDal";

// Deliberately minimal: LibraryClient already renders its own header
// (Brand + navigation + sign out), so this layout only decides who gets
// past the door — no extra chrome to avoid doubling anything.
//
// Structured to extend cleanly for subscription gating later:
//   authenticated + subscription active   -> render children (today)
//   authenticated + subscription inactive -> redirect("/assinatura")
// Not implemented yet - no subscription_status exists to check, so
// there is exactly one state to add here when it does (see
// lib/supabase/customerDal.ts).
export default async function AppProtectedLayout({ children }: { children: ReactNode }) {
  const auth = await getCustomerAuthState();

  if (auth.status === "unauthenticated") {
    redirect("/login?redirect=/app");
  }

  return <>{children}</>;
}
