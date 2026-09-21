import Link from "next/link";
import type { CSSProperties } from "react";

export function CtaButton({
  href,
  label,
  fullWidth = false,
  className = "",
  style,
}: {
  href: string;
  label: string;
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Link
      href={href}
      style={style}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 text-sm font-extrabold uppercase tracking-wide text-accent-foreground shadow-[0_0_0_1px_rgba(245,197,24,0.35),0_20px_40px_-16px_rgba(245,197,24,0.45)] transition-all duration-200 hover:shadow-[0_0_0_1px_rgba(245,197,24,0.5),0_24px_48px_-16px_rgba(245,197,24,0.6)] hover:brightness-105 active:scale-[0.98] sm:text-base ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {label}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden="true"
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
