"use client";

import { CATEGORIES } from "@/lib/taxonomy";

// Category only - type (Imagem/Vídeo/Texto) has its own tabs (see
// TypeTabs.tsx) and must never appear here too, or a chip could imply
// mixing types within one tab. Every value here has a real
// corresponding category in lib/taxonomy.ts - no loose tags
// ("Instagram", "Códigos") that don't map to the taxonomy.
export const FILTERS = ["Todos", ...CATEGORIES] as const;

export type FilterValue = (typeof FILTERS)[number];

export function FilterChips({
  active,
  onChange,
}: {
  active: FilterValue;
  onChange: (filter: FilterValue) => void;
}) {
  return (
    <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth">
      {FILTERS.map((filter) => {
        const isActive = filter === active;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            aria-pressed={isActive}
            className={`shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 active:scale-[0.96] ${
              isActive
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-muted hover:border-border/80 hover:text-foreground"
            }`}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
