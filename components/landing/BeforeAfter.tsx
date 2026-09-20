"use client";

import { useEffect, useRef, useState } from "react";
import type { LpBeforeAfterPair } from "@/lib/supabase/lpBeforeAfter";
import { BeforeAfterSlider } from "@/components/landing/BeforeAfterSlider";

// One card per view on mobile (scroll-snap carousel + dots/arrows/"1 de
// N"), all cards at once on larger screens (sm:) where there's no
// touch-swipe-vs-drag-to-compare conflict to solve in the first place.
// Card-to-card navigation (dots, arrows, native swipe on the snap
// container) is deliberately a separate surface from the compare
// slider's own drag area (see BeforeAfterSlider) — swiping the image
// itself always compares, never advances the carousel.
export function BeforeAfter({ pairs }: { pairs: LpBeforeAfterPair[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || pairs.length === 0) return;

    // IntersectionObserver instead of a scroll listener — no per-frame
    // work, and it naturally reports which card is actually centered in
    // the snap container.
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
  }, [pairs.length]);

  function scrollToIndex(index: number) {
    cardRefs.current[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  if (pairs.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Veja a transformação na prática
          </h2>
          <p className="max-w-xl text-sm text-muted">Arraste para comparar antes e depois.</p>
        </div>

        <div
          ref={scrollerRef}
          className="no-scrollbar mt-10 flex snap-x snap-mandatory scroll-smooth overflow-x-auto sm:flex-wrap sm:justify-center sm:gap-5 sm:overflow-visible sm:snap-none"
        >
          {pairs.map((pair, index) => (
            <div
              key={pair.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              data-index={index}
              className="w-full shrink-0 snap-center sm:w-auto sm:shrink"
            >
              <BeforeAfterSlider
                beforeUrl={pair.before_image_url}
                afterUrl={pair.after_image_url}
                title={pair.title ?? undefined}
                onPrev={pairs.length > 1 ? () => scrollToIndex(Math.max(0, activeIndex - 1)) : undefined}
                onNext={
                  pairs.length > 1 ? () => scrollToIndex(Math.min(pairs.length - 1, activeIndex + 1)) : undefined
                }
                prevDisabled={activeIndex === 0}
                nextDisabled={activeIndex === pairs.length - 1}
              />
            </div>
          ))}
        </div>

        {pairs.length > 1 && (
          <div className="mt-4 flex flex-col items-center gap-2 sm:hidden">
            <div className="flex items-center gap-1.5">
              {pairs.map((pair, index) => (
                <button
                  key={pair.id}
                  type="button"
                  aria-label={`Ir para o par ${index + 1}`}
                  aria-current={index === activeIndex}
                  onClick={() => scrollToIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    index === activeIndex ? "w-5 bg-accent" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted">
              {activeIndex + 1} de {pairs.length}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
