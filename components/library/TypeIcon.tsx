import type { PromptType } from "@/lib/types";

export function TypeIcon({ type, className = "h-4 w-4" }: { type: PromptType; className?: string }) {
  if (type === "Imagem") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M21 16l-5.5-5.5L4 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "Vídeo") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <rect x="3" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M17 10l4-2.5v9L17 14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2M16 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2M10 4l4 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
