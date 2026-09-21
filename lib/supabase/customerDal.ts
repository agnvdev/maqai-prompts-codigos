import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Mirrors lib/supabase/dal.ts's getAdminAuthState shape/pattern, but for
// the customer-facing side: no is_admin check here at all — a customer
// is authorized just by having a valid session, admin authorization is
// a completely separate concern handled by dal.ts/requireAdmin.ts,
// untouched by this file.
export interface CustomerUser {
  id: string;
  email: string | null;
  fullName: string | null;
}

// Deliberately only 2 states today. When subscription gating ships,
// add a third state here ("no_subscription" or similar) the exact same
// way "forbidden" was added to AdminAuthState — do not invent a
// subscription_status field/column before it actually exists.
export type CustomerAuthState =
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: CustomerUser };

export const getCustomerAuthState = cache(async (): Promise<CustomerAuthState> => {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { status: "unauthenticated" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    return {
      status: "authenticated",
      user: { id: user.id, email: user.email ?? null, fullName: profile?.full_name ?? null },
    };
  } catch (error) {
    // Next throws a control-flow error from `cookies()` while probing a
    // route for static rendering; that must propagate, not be swallowed.
    unstable_rethrow(error);
    console.error("Failed to resolve customer auth state:", error);
    return { status: "unauthenticated" };
  }
});
