"use client";

// Deliberately separate from FilterChips (taxonomy categories) and
// TypeTabs (content type) - favorites are a personal, cross-cutting
// concept, not a taxonomy value, so it gets its own control next to the
// search bar instead of living inside either row. Same heart glyph as
// components/ui/FavoriteButton.tsx (the per-card toggle) for visual
// consistency between "this prompt is favorited" and "show only
// favorited prompts".
export function FavoritesToggle({
  active,
  onToggle,
  count,
}: {
  active: boolean;
  onToggle: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-200 active:scale-[0.96] ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface text-muted hover:border-border/80 hover:text-foreground"
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} aria-hidden="true">
        <path
          d="M12 21s-7.5-4.6-10-9.1C0.3 8.2 2 4.5 5.6 4c2.1-.3 4 .8 6.4 3.4C14.4 4.8 16.3 3.7 18.4 4c3.6.5 5.3 4.2 3.6 7.9C19.5 16.4 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      Favoritos
      {count != null && count > 0 && (
        <span className={active ? "text-accent/80" : "text-muted"}>({count})</span>
      )}
    </button>
  );
}
