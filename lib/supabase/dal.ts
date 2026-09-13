import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string | null;
}

export type AdminAuthState =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "admin"; user: AdminUser };

// Centralizes every failure mode of the admin auth check (missing env
// vars, unreachable Supabase, authenticated user with no profile row,
// etc.) into one of three explicit states instead of letting any of
// them throw up to the layout/page and render as a 500.
export const getAdminAuthState = cache(async (): Promise<AdminAuthState> => {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { status: "unauthenticated" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) return { status: "forbidden" };

    return { status: "admin", user: { id: user.id, email: user.email ?? null } };
  } catch (error) {
    // Next throws a control-flow error from `cookies()` while probing a
    // route for static rendering; that must propagate, not be swallowed.
    unstable_rethrow(error);
    console.error("Failed to resolve admin auth state:", error);
    return { status: "unauthenticated" };
  }
});
