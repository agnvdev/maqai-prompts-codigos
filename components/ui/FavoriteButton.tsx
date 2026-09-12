"use client";

export function FavoriteButton({
  active,
  onToggle,
  className = "",
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface-2 text-muted hover:text-foreground"
      } ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        aria-hidden="true"
      >
        <path
          d="M12 21s-7.5-4.6-10-9.1C0.3 8.2 2 4.5 5.6 4c2.1-.3 4 .8 6.4 3.4C14.4 4.8 16.3 3.7 18.4 4c3.6.5 5.3 4.2 3.6 7.9C19.5 16.4 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
