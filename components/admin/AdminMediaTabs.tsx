"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { id: "lp", label: "Landing Page" },
  { id: "prompts", label: "Imagens dos prompts" },
] as const;
type TabId = (typeof TABS)[number]["id"];

// Splits what used to be one long undifferentiated page into "mídia real
// da Landing Page" vs "biblioteca/fallback dos cards de prompt" - the two
// were mixed together before, which is exactly the confusion this OPER
// asks to remove. Both panels are always rendered (not refetched on
// switch) and toggled with CSS, so switching tabs is instant.
export function AdminMediaTabs({ landingPage, promptImages }: { landingPage: ReactNode; promptImages: ReactNode }) {
  const [tab, setTab] = useState<TabId>("lp");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 sm:w-fit">
        {TABS.map(({ id, label }) => {
          const active = id === tab;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={active}
              className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.98] sm:flex-none ${
                active ? "bg-accent text-accent-foreground shadow-card" : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className={tab === "lp" ? "flex flex-col gap-4" : "hidden"}>{landingPage}</div>
      <div className={tab === "prompts" ? "flex flex-col gap-4" : "hidden"}>{promptImages}</div>
    </div>
  );
}
