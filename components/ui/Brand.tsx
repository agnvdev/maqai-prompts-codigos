import Link from "next/link";
import Image from "next/image";

// The mark is a square symbol, not a full horizontal signature, so it
// always sits beside the "MaqAI" wordmark rather than replacing it.
// logoUrl comes from the admin-managed lp_media row (slot "logo",
// identifier "Logo" — see BrandAssetsClient.tsx); with none set, only
// the wordmark renders.
export function Brand({ href = "/", logoUrl }: { href?: string; logoUrl?: string | null }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      {logoUrl && (
        <span className="relative h-9 w-9 shrink-0 sm:h-10 sm:w-10">
          {/* Decorative: the adjacent wordmark already names the brand. */}
          <Image src={logoUrl} alt="" fill sizes="40px" className="object-contain" />
        </span>
      )}
      <span className="text-xl font-bold leading-none tracking-[-0.02em] text-foreground">
        Maq<span className="text-accent transition-colors group-hover:text-accent/80">AI</span>
      </span>
    </Link>
  );
}
