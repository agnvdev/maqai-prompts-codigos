import type { Type } from "@/lib/taxonomy";

// The primary navigation for /app: every card everywhere on the page is
// scoped to exactly one of these 3 types, never mixed. Visually the
// strongest control on the page on purpose (solid accent fill on the
// active tab) so it reads as clearly more important than the secondary
// category chips below it (see FilterChips.tsx, which only tints on
// active instead of filling) - "aba principal visualmente mais forte
// que filtros secundários".
const TABS: { type: Type; label: string }[] = [
  { type: "Imagem", label: "Imagens" },
  { type: "Vídeo", label: "Vídeos" },
  { type: "Texto", label: "Textos e códigos" },
];

export function TypeTabs({
  active,
  counts,
  onChange,
}: {
  active: Type;
  counts: Partial<Record<Type, number>>;
  onChange: (type: Type) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
      {TABS.map(({ type, label }) => {
        const isActive = type === active;
        const count = counts[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            aria-pressed={isActive}
            className={`flex-1 rounded-lg px-2 py-2.5 text-center text-[13px] font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.98] sm:text-sm ${
              isActive
                ? "bg-accent text-accent-foreground shadow-card"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
            {count != null && (
              <span className={isActive ? "ml-1 font-medium text-accent-foreground/75" : "ml-1 font-medium text-muted"}>
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
