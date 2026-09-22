// Shared across browser.ts, server.ts and proxy.ts so every place that
// creates a Supabase client (and therefore can set the session cookie)
// agrees on the same flags. @supabase/ssr's own defaults are
// { path: "/", sameSite: "lax", httpOnly: false } - sameSite/path are
// fine, but `secure` isn't forced true by default, so on a deployment
// that ever serves the app over plain HTTP the session cookie could be
// sent in cleartext. `httpOnly` is intentionally left false here (not a
// bug): the browser client reads/writes this same cookie directly to
// keep client and server session state in sync, which is the whole
// point of the @supabase/ssr cookie-sharing pattern - flipping it to
// true would break that. The mitigation for that trade-off is
// preventing XSS in the first place (output encoding, no
// dangerouslySetInnerHTML with unsanitized input), not a cookie flag.
export const SUPABASE_COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
} as const;
