import type { ReactNode } from "react";

// Shared shell for a single-image admin block (Hero, CTA final): a
// heading, its purpose and recommended dimension, then whatever upload
// control the caller passes in.
export function MediaSlotSection({
  title,
  purpose,
  dimension,
  children,
}: {
  title: string;
  purpose: string;
  dimension: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-bold text-foreground">{title}</h1>
      <p className="text-xs text-muted">{purpose}</p>
      <p className="text-xs text-muted">Dimensão recomendada: {dimension}</p>
      <div className="max-w-xs">{children}</div>
    </div>
  );
}
