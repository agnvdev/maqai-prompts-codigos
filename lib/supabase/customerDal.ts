import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Mirrors lib/supabase/dal.ts's getAdminAuthState shape/pattern, but for
// the customer-facing side. Admin authorization itself is still a
// completely separate concern, handled entirely by
// dal.ts/requireAdmin.ts for /admin - this file only reads is_admin to
// decide whether *this* gate (the /app subscription check) applies to
// the signed-in user at all, since an admin must reach /app without
// ever needing a subscription.
export interface CustomerUser {
  id: string;
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
}

// Subscription gating has shipped: a third state was added the same way
// "forbidden" was added to AdminAuthState, backed by the real
// subscriptions table (see supabase/migrations/20260921150000_subscriptions.sql)
// instead of a guessed-at profiles column.
export type CustomerAuthState =
  | { status: "unauthenticated" }
  | { status: "no_subscription"; user: CustomerUser }
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
      .select("full_name, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    const customerUser: CustomerUser = {
      id: user.id,
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
      isAdmin: profile?.is_admin === true,
    };

    // Admins bypass the subscription check entirely - they never had
    // one and never need one, and the subscriptions table is not even
    // queried for them (nothing to consult, per the /admin gate's own
    // rule that it never touches subscriptions either).
    if (customerUser.isAdmin) {
      return { status: "authenticated", user: customerUser };
    }

    // Independent try/catch: if the subscriptions migration hasn't been
    // applied yet, this must not take down auth entirely (that would
    // read as "logged out" for every customer) - it should just fail
    // closed into no_subscription, same as truly having none.
    //
    // Only "authorized" (Mercado Pago's own status for a live, paid-up
    // preapproval) counts as active - "pending", "paused" and
    // "cancelled" all fall through to no_subscription.
    let hasActiveSubscription = false;
    try {
      const { data: activeSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "authorized")
        .limit(1)
        .maybeSingle();
      hasActiveSubscription = !!activeSubscription;
    } catch (error) {
      unstable_rethrow(error);
      console.error("Failed to resolve subscription status:", error);
    }

    if (!hasActiveSubscription) return { status: "no_subscription", user: customerUser };

    return { status: "authenticated", user: customerUser };
  } catch (error) {
    // Next throws a control-flow error from `cookies()` while probing a
    // route for static rendering; that must propagate, not be swallowed.
    unstable_rethrow(error);
    console.error("Failed to resolve customer auth state:", error);
    return { status: "unauthenticated" };
  }
});
