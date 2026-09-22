import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_COOKIE_OPTIONS } from "@/lib/supabase/cookieOptions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseKey, { cookieOptions: SUPABASE_COOKIE_OPTIONS });
}
