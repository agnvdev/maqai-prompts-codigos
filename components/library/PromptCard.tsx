"use client";

import Image from "next/image";
import type { Prompt } from "@/lib/types";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { TypeIcon } from "@/components/library/TypeIcon";

export function PromptCard({
  prompt,
  isFavorite,
  onToggleFavorite,
  onOpen,
  width = "w-[260px]",
}: {
  prompt: Prompt;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (prompt: Prompt) => void;
  width?: string;
}) {
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
      className={`group flex ${width} shrink-0 cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent/40 active:translate-y-0 active:scale-[0.99]`}
    >
      <div className="relative -mx-4 -mt-4 h-28 overflow-hidden rounded-t-2xl sm:h-32">
        {prompt.image_url ? (
          <Image
            src={prompt.image_url}
            alt={prompt.title}
            fill
            sizes="260px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-2">
            <TypeIcon type={prompt.type} className="h-8 w-8 text-muted" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
      </div>

      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 font-mono text-[11px] font-medium text-accent transition-colors group-hover:bg-background">
          <TypeIcon type={prompt.type} className="h-3.5 w-3.5" />
          {prompt.code}
        </span>
        <FavoriteButton
          active={isFavorite}
          onToggle={() => onToggleFavorite(prompt.id)}
          className="h-7 w-7"
        />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
          {prompt.title}
        </h3>
        <p className="line-clamp-2 text-[13px] leading-snug text-muted">
          {prompt.description}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
          {prompt.segment}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
          {prompt.type}
        </span>
      </div>
    </div>
  );
}
