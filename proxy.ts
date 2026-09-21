import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Refreshes the Supabase session cookie on every request. Without this,
// nothing proactively rewrites a refreshed access/refresh token pair
// back to cookies during plain GET navigations (Server Components can
// only read cookies, never set them - see the setAll no-op comment in
// lib/supabase/server.ts), so a long-lived session could silently go
// stale between visits.
//
// This does NOT gate any route itself - route protection stays in each
// area's own layout (app/admin/(protected)/layout.tsx,
// app/app/(protected)/layout.tsx), same as before this file existed, so
// there's exactly one place per area that decides who gets in.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
