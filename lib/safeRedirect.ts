// Guards against open redirects: a `?redirect=`/`?next=` value only ever
// comes from a URL, so it must never be trusted as-is. Only a single
// leading-slash internal path is accepted; anything else (an absolute
// URL, a protocol-relative "//evil.com", a backslash trick, or nothing
// at all) falls back to the default.
const DEFAULT_REDIRECT = "/app";

export function getSafeRedirect(path: string | null | undefined): string {
  if (!path) return DEFAULT_REDIRECT;
  if (!path.startsWith("/")) return DEFAULT_REDIRECT;
  if (path.startsWith("//") || path.startsWith("/\\")) return DEFAULT_REDIRECT;
  return path;
}
