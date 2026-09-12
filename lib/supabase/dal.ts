import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string | null;
}

export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;

  return { id: user.id, email: user.email ?? null };
});
