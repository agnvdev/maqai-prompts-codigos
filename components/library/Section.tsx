import type { Prompt } from "@/lib/types";
import { PromptCard } from "@/components/library/PromptCard";

export function Section({
  title,
  prompts,
  favorites,
  onToggleFavorite,
  onOpen,
}: {
  title: string;
  prompts: Prompt[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpen: (prompt: Prompt) => void;
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
      </div>
    </section>
  );
}
