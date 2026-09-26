"use client";

import Image from "next/image";
import type { Prompt } from "@/lib/types";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { TypeIcon } from "@/components/library/TypeIcon";
import { resolvePromptImage, type PromptDefaultImagesMap } from "@/lib/supabase/promptDefaults";
import { getPromptBadges, type PromptBadge, type PromptBadgeKind } from "@/lib/badges";

const BADGE_STYLES: Record<PromptBadgeKind, string> = {
  exclusivo: "border-accent bg-accent text-accent-foreground",
  testado: "border-accent/50 bg-surface/95 text-accent",
  novo: "border-accent/30 bg-surface/95 text-accent",
  "em-alta": "border-border bg-surface/95 text-foreground",
};

function BadgePill({ badge }: { badge: PromptBadge }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-card ${BADGE_STYLES[badge.kind]}`}
    >
      {badge.kind === "testado" && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 12l6 6L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {badge.label}
    </span>
  );
}

export function PromptCard({
  prompt,
  isFavorite,
  onToggleFavorite,
  onOpen,
  width = "w-[260px]",
  defaultImagesMap,
}: {
  prompt: Prompt;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (prompt: Prompt) => void;
  width?: string;
  defaultImagesMap?: PromptDefaultImagesMap;
}) {
  // Priority: the prompt's own image -> a category/segment/type default
  // registered in /admin/media -> the TypeIcon placeholder (imageUrl null).
  const imageUrl = resolvePromptImage(prompt, defaultImagesMap ?? {});
  const badges = getPromptBadges(prompt);
  const primaryTool = prompt.tools[0];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(prompt)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(prompt);
        }
      }}
      className={`group flex ${width} shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent/40 active:translate-y-0 active:scale-[0.99]`}
    >
      {/* Image is the card's primary element: a full-bleed, fixed-ratio
          panel so the grid stays aligned regardless of source aspect
          ratio, with badges and favorite anchored to it instead of
          competing with the text block below. */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface-2">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={prompt.title}
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 80vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <TypeIcon type={prompt.type} className="h-10 w-10 text-muted" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 to-transparent" />

        {badges.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {badges.map((badge) => (
              <BadgePill key={badge.kind} badge={badge} />
            ))}
          </div>
        )}

        <FavoriteButton
          active={isFavorite}
          onToggle={() => onToggleFavorite(prompt.id)}
          className="absolute right-2 top-2 h-9 w-9 shadow-card"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 font-mono text-[11px] font-medium text-accent transition-colors group-hover:bg-background">
            <TypeIcon type={prompt.type} className="h-3.5 w-3.5" />
            {prompt.code}
          </span>
          {primaryTool && (
            <span className="truncate text-[11px] font-medium text-muted">{primaryTool}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
            {prompt.title}
          </h3>
          <p className="line-clamp-2 text-[13px] leading-snug text-muted">
            {prompt.description}
          </p>
        </div>

        <CopyButton text={prompt.prompt} label="Copiar" className="mt-auto w-full py-2 text-xs" />
      </div>
    </div>
  );
}
