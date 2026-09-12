"use client";

import { useCopy } from "@/lib/useCopy";

export function CopyButton({
  text,
  className = "",
  label = "Copiar prompt",
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const { copied, copy } = useCopy();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void copy(text);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
        copied
          ? "bg-emerald-500 text-black"
          : "bg-accent text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] hover:brightness-110"
      } ${className}`}
    >
      {copied ? (
        <>
          <CheckIcon /> Copiado!
        </>
      ) : (
        <>
          <CopyIcon /> {label}
        </>
      )}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15V5a2 2 0 0 1 2-2h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12l6 6L20 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
