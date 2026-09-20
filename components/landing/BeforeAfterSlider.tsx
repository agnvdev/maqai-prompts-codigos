"use client";

import { useRef } from "react";
import Image from "next/image";

// Drag position is a continuous, high-frequency value, so it's kept in a
// ref and mutated directly on the DOM during pointermove instead of
// useState — re-rendering the React tree on every pixel of drag would be
// wasteful and jank-prone. React only re-renders on mount and on
// keyboard nudges (a handful of discrete key presses, not a problem).
export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  title,
}: {
  beforeUrl: string;
  afterUrl: string;
  title?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef(50);
  const draggingRef = useRef(false);

  function setPercent(percent: number) {
    const clamped = Math.min(100, Math.max(0, percent));
    percentRef.current = clamped;
    if (clipRef.current) clipRef.current.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
    if (handleRef.current) handleRef.current.style.left = `${clamped}%`;
    if (sliderRef.current) sliderRef.current.setAttribute("aria-valuenow", String(Math.round(clamped)));
  }

  function percentFromClientX(clientX: number): number {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return percentRef.current;
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function onPointerDown(e: React.PointerEvent) {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setPercent(percentFromClientX(e.clientX));
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    setPercent(percentFromClientX(e.clientX));
  }

  function onPointerUp() {
    draggingRef.current = false;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") setPercent(percentRef.current - 5);
    else if (e.key === "ArrowRight") setPercent(percentRef.current + 5);
    else if (e.key === "Home") setPercent(0);
    else if (e.key === "End") setPercent(100);
  }

  return (
    <div className="mx-auto flex w-full max-w-[340px] flex-col gap-2 sm:mx-0 sm:w-[340px] sm:shrink-0">
      <div
        ref={containerRef}
        className="group relative aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Image src={afterUrl} alt="Depois" fill sizes="340px" className="object-cover" draggable={false} />

        <div ref={clipRef} className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
          <Image src={beforeUrl} alt="Antes" fill sizes="340px" className="object-cover" draggable={false} />
        </div>

        <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted backdrop-blur-sm">
          Antes
        </span>
        <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
          Depois
        </span>

        <div ref={handleRef} className="absolute inset-y-0 cursor-ew-resize" style={{ left: "50%" }}>
          <div className="h-full w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.4)]" />
          <div
            ref={sliderRef}
            role="slider"
            tabIndex={0}
            aria-label="Comparar antes e depois"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={50}
            onKeyDown={onKeyDown}
            className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg outline-none transition-transform duration-150 group-hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 7l-5 5 5 5M16 7l5 5-5 5"
                stroke="#0a0a0a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {title && <span className="px-1 text-sm font-medium text-foreground">{title}</span>}
    </div>
  );
}
