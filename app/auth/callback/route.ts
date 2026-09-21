import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeRedirect } from "@/lib/safeRedirect";

// Landing spot for every Supabase auth email link: signup confirmation
// (emailRedirectTo from /cadastro) and password recovery (redirectTo
// from /recuperar-senha) both point here. Handles both link formats
// Supabase can produce depending on project/email-template
// configuration - a PKCE "?code=" or an OTP "?token_hash=&type=" - since
// that configuration isn't something this client can introspect ahead
// of time.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirect(searchParams.get("next"));

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=confirm_failed`);
}
