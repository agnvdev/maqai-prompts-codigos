import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_COOKIE_OPTIONS } from "@/lib/supabase/cookieOptions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render; safe to ignore because
          // session refresh already happens in Server Actions/Route Handlers.
        }
      },
    },
  });
}
