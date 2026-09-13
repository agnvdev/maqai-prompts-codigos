"use client";

import { TAGS } from "@/lib/taxonomy";

export const FILTERS = ["Todos", "Favoritos", ...TAGS] as const;

export type FilterValue = (typeof FILTERS)[number];

export function FilterChips({
  active,
  onChange,
}: {
  active: FilterValue;
  onChange: (filter: FilterValue) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {FILTERS.map((filter) => {
        const isActive = filter === active;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            aria-pressed={isActive}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-200 active:scale-[0.96] ${
              isActive
                ? "border-accent bg-accent text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.3)_inset]"
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
