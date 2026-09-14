import type { Prompt } from "@/lib/types";
import { PromptCard } from "@/components/library/PromptCard";

export function Section({
  title,
  prompts,
  favorites,
  onToggleFavorite,
  onOpen,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: {
  title: string;
  prompts: Prompt[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpen: (prompt: Prompt) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  if (prompts.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-4 text-lg font-bold tracking-tight text-foreground sm:px-6">{title}</h2>
      <div
        className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 sm:px-6"
        style={{
          maskImage: "linear-gradient(to right, black 94%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 94%, transparent 100%)",
        }}
      >
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            isFavorite={favorites.includes(prompt.id)}
            onToggleFavorite={onToggleFavorite}
            onOpen={onOpen}
          />
        ))}

        {hasMore && onLoadMore && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="flex w-[110px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-surface p-4 text-center text-xs font-medium text-muted transition-colors duration-200 hover:border-accent/50 hover:text-foreground disabled:opacity-60"
          >
            {loadingMore ? "Carregando..." : "Carregar mais"}
          </button>
        )}
      </div>
    </section>
  );
}
