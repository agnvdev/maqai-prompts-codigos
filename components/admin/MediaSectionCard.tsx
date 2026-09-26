import type { ReactNode } from "react";

// Native <details>/<summary> disclosure - open by default (nothing is
// hidden that wasn't visible before), but collapsible so a long list of
// LP sections doesn't turn mobile into one giant continuous scroll (see
// OPER "Reorganizar Mídias da LP" - "evitar página contínua gigantesca").
// Zero JS needed, so this stays a Server Component.
export function MediaSectionCard({
  title,
  whereUsed,
  children,
}: {
  title: string;
  whereUsed: string;
  children: ReactNode;
}) {
  return (
    <details
      open
      className="group rounded-2xl border border-border bg-surface/40 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted">{whereUsed}</p>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="flex flex-col gap-4 border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
