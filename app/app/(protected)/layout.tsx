import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCustomerAuthState } from "@/lib/supabase/customerDal";

// Deliberately minimal: LibraryClient already renders its own header
// (Brand + navigation + sign out), so this layout only decides who gets
// past the door — no extra chrome to avoid doubling anything.
//
// Subscription gating: authenticated without an active subscription goes
// to /plano instead of rendering the library (see
// lib/supabase/customerDal.ts for what counts as active).
export default async function AppProtectedLayout({ children }: { children: ReactNode }) {
  const auth = await getCustomerAuthState();

  if (auth.status === "unauthenticated") {
    redirect("/login?redirect=/app");
  }

  if (auth.status === "no_subscription") {
    redirect("/plano");
  }

  return <>{children}</>;
}
