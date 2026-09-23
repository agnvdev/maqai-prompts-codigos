"use client";

import { useEffect, useRef, useState } from "react";
import type { Prompt } from "@/lib/types";
import type { PromptDefaultImagesMap } from "@/lib/supabase/promptDefaults";
import { PromptCard } from "@/components/library/PromptCard";

// Real horizontal carousel: scroll-snap on every breakpoint (never
// switches to a wrapped/static row like the landing page's
// Antes/Depois carousel does at sm: - a library section can have
// dozens of cards, so desktop needs to keep scrolling, just with
// visible arrows instead of relying on drag alone). Active-card
// tracking mirrors components/landing/BeforeAfter.tsx's
// IntersectionObserver approach - re-observes whenever the prompt list
// grows (via "Carregar mais"), so the counter and arrow-disabled state
// stay correct after loading more.
export function Section({
  title,
  count,
  prompts,
  favorites,
  onToggleFavorite,
  onOpen,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onViewAll,
  defaultImagesMap,
}: {
  title: string;
  count?: number;
  prompts: Prompt[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpen: (prompt: Prompt) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onViewAll?: () => void;
  defaultImagesMap?: PromptDefaultImagesMap;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || prompts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (entry.intersectionRatio > (best?.ratio ?? 0)) best = { index, ratio: entry.intersectionRatio };
        }
        if (best && best.ratio > 0.5) setActiveIndex(best.index);
      },
      { root: scroller, threshold: [0.5, 0.75, 1] }
    );

    for (const card of cardRefs.current) {
      if (card) observer.observe(card);
    }

    return () => observer.disconnect();
  }, [prompts.length]);

  function scrollByPage(direction: 1 | -1) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // 90% of the visible width, not 100% - scroll-snap corrects the
    // final rest position to the nearest full card regardless, and the
    // slight overlap keeps a hair of the previous page in view so
    // users don't lose their place.
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.9, behavior: "smooth" });
  }

  if (prompts.length === 0) return null;

  const totalCount = count ?? prompts.length;
  const showNav = prompts.length > 1;
  const prevDisabled = activeIndex === 0;
  const nextDisabled = activeIndex >= prompts.length - 1 && !hasMore;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6">
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        <div className="flex shrink-0 items-center gap-3">
          {showNav && (
            <span className="text-xs font-medium text-muted">
              {activeIndex + 1} de {totalCount}
            </span>
          )}
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="shrink-0 text-xs font-semibold text-accent transition-colors duration-200 hover:underline"
            >
              Ver todos
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        {showNav && (
          <button
            type="button"
            aria-label="Prompts anteriores"
            onClick={() => scrollByPage(-1)}
            disabled={prevDisabled}
            className="absolute left-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-card backdrop-blur-sm transition-all duration-200 hover:border-accent/50 active:scale-90 disabled:opacity-30 sm:flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory scroll-smooth gap-3 overflow-x-auto px-4 pb-1 sm:px-6"
        >
          {prompts.map((prompt, index) => (
            <div
              key={prompt.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              data-index={index}
              className="shrink-0 snap-start"
            >
              <PromptCard
                prompt={prompt}
                isFavorite={favorites.includes(prompt.id)}
                onToggleFavorite={onToggleFavorite}
                onOpen={onOpen}
                defaultImagesMap={defaultImagesMap}
              />
            </div>
          ))}

          {hasMore && onLoadMore && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="flex w-[110px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-surface p-4 text-center text-xs font-medium text-muted transition-colors duration-200 hover:border-accent/50 hover:text-foreground disabled:opacity-60"
            >
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          )}
        </div>

        {showNav && (
          <button
            type="button"
            aria-label="Próximos prompts"
            onClick={() => scrollByPage(1)}
            disabled={nextDisabled}
            className="absolute right-1 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-card backdrop-blur-sm transition-all duration-200 hover:border-accent/50 active:scale-90 disabled:opacity-30 sm:flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
