import Link from "next/link";
import Image from "next/image";

// logoUrl comes from the admin-managed lp_media row (slot "logo",
// identifier "Logo" — see BrandAssetsClient.tsx). Logo and wordmark are
// alternatives, never combined: when a logo is set it fully replaces the
// text mark, and every caller falls back to the wordmark on their own
// (undefined/null logoUrl) if the fetch fails or nothing is uploaded yet.
export function Brand({ href = "/", logoUrl }: { href?: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <Link href={href} className="relative block h-9 w-9 shrink-0 sm:h-10 sm:w-10">
        <Image src={logoUrl} alt="MaqDesk" fill sizes="40px" className="object-contain" />
      </Link>
    );
  }

  return (
    <Link href={href} className="group flex flex-col leading-none">
      <span className="text-xl font-bold tracking-[-0.02em] text-foreground">
        Maq<span className="text-accent transition-colors group-hover:text-accent/80">Desk</span>
      </span>
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
        Plataforma de IA
      </span>
    </Link>
  );
}
