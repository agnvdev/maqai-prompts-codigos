import { getAdminAuthState } from "@/lib/supabase/dal";

export async function requireAdmin() {
  const auth = await getAdminAuthState();
  if (auth.status !== "admin") throw new Error("Não autorizado.");
  return auth.user;
}
