"use client";

import { useEffect } from "react";
import type { Prompt } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { FavoriteButton } from "@/components/ui/FavoriteButton";

export function PromptDrawer({
  prompt,
  isFavorite,
  onToggleFavorite,
  onClose,
}: {
  prompt: Prompt | null;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!prompt) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [prompt, onClose]);

  if (!prompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="animate-scale-in absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="animate-drawer-in relative flex max-h-[88vh] w-full flex-col rounded-t-3xl border-t border-border bg-surface p-6 shadow-2xl sm:h-full sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-3xl sm:border-l sm:border-t-0">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="w-fit rounded-md bg-surface-2 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
              {prompt.code}
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{prompt.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <FavoriteButton active={isFavorite} onToggle={() => onToggleFavorite(prompt.id)} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar detalhes"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2 text-muted transition-colors duration-200 hover:text-foreground active:scale-[0.95]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <p className="text-sm leading-relaxed text-muted">{prompt.description}</p>

          <div className="flex flex-wrap gap-2">
            <Badge>{prompt.category}</Badge>
            <Badge>{prompt.segment}</Badge>
            <Badge>{prompt.type}</Badge>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Ferramentas recomendadas
            </span>
            <div className="flex flex-wrap gap-2">
              {prompt.tools.map((tool) => (
                <Badge key={tool}>{tool}</Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Prompt completo
            </span>
            <pre className="shadow-card whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-mono text-[13px] leading-relaxed text-foreground">
              {prompt.prompt}
            </pre>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <CopyButton text={prompt.prompt} className="w-full py-3.5" />
        </div>
      </div>
    </div>
  );
}
