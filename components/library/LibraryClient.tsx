"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Prompt } from "@/lib/types";
import { useFavorites, useRecents } from "@/lib/hooks";
import { Brand } from "@/components/ui/Brand";
import { SearchBar } from "@/components/library/SearchBar";
import { FilterChips, type FilterValue } from "@/components/library/FilterChips";
import { Section } from "@/components/library/Section";
import { PromptCard } from "@/components/library/PromptCard";
import { PromptDrawer } from "@/components/library/PromptDrawer";

function matchesFilter(prompt: Prompt, filter: FilterValue, favorites: string[]): boolean {
  if (filter === "Todos") return true;
  if (filter === "Favoritos") return favorites.includes(prompt.id);
  return (prompt.tags as readonly string[]).includes(filter);
}

function matchesSearch(prompt: Prompt, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    prompt.title.toLowerCase().includes(q) ||
    prompt.description.toLowerCase().includes(q) ||
    prompt.code.toLowerCase().includes(q) ||
    prompt.prompt.toLowerCase().includes(q)
  );
}

function byIds(allPrompts: Prompt[], ids: string[]): Prompt[] {
  return ids
    .map((id) => allPrompts.find((p) => p.id === id))
    .filter((p): p is Prompt => Boolean(p));
}

export function LibraryClient({ prompts: allPrompts }: { prompts: Prompt[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("Todos");
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);

  const { favorites, toggleFavorite } = useFavorites();
  const { recents, addRecent } = useRecents();

  const isBrowsingHome = filter === "Todos" && query.trim() === "";

  const filteredPrompts = useMemo(
    () =>
      allPrompts.filter(
        (p) => matchesFilter(p, filter, favorites) && matchesSearch(p, query)
      ),
    [allPrompts, filter, query, favorites]
  );

  const sections = useMemo(
    () => ({
      comeceAqui: allPrompts.filter((p) => p.category === "Essenciais"),
      maisUsados: allPrompts.filter((p) => p.featured),
      codigosVirais: allPrompts.filter((p) => p.tags.includes("Códigos")),
      maquinasPesadas: allPrompts.filter((p) => p.segment === "Máquinas Pesadas"),
      agro: allPrompts.filter((p) => p.segment === "Agro"),
      mineracao: allPrompts.filter((p) => p.segment === "Mineração"),
      combos: allPrompts.filter((p) => p.category === "Combos"),
    }),
    [allPrompts]
  );

  function openPrompt(prompt: Prompt) {
    setActivePrompt(prompt);
    addRecent(prompt.id);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Brand />
          <Link
            href="/"
            className="text-xs font-medium text-muted transition-colors duration-200 hover:text-foreground"
          >
            ← Início
          </Link>
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pb-4 sm:px-6">
          <SearchBar value={query} onChange={setQuery} />
          <FilterChips active={filter} onChange={setFilter} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 py-6">
        {isBrowsingHome ? (
          <>
            {recents.length > 0 && (
              <Section
                title="Vistos recentemente"
                prompts={byIds(allPrompts, recents)}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onOpen={openPrompt}
              />
            )}
            <Section
              title="Comece aqui"
              prompts={sections.comeceAqui}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpen={openPrompt}
            />
            <Section
              title="Mais usados"
              prompts={sections.maisUsados}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpen={openPrompt}
            />
            <Section
              title="Códigos virais"
              prompts={sections.codigosVirais}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpen={openPrompt}
            />
            <Section
              title="Máquinas pesadas"
              prompts={sections.maquinasPesadas}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpen={openPrompt}
            />
            <Section
              title="Agro"
              prompts={sections.agro}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpen={openPrompt}
            />
            <Section
              title="Mineração"
              prompts={sections.mineracao}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpen={openPrompt}
            />
            <Section
              title="Combos"
              prompts={sections.combos}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpen={openPrompt}
            />
          </>
        ) : (
          <div className="flex flex-col gap-4 px-4 sm:px-6">
            <h2 className="text-sm font-medium tracking-tight text-muted">
              {filteredPrompts.length}{" "}
              {filteredPrompts.length === 1 ? "resultado encontrado" : "resultados encontrados"}
            </h2>

            {filteredPrompts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 py-16 text-center">
                <p className="font-medium text-foreground">Nenhum prompt encontrado</p>
                <p className="text-sm text-muted">
                  Tente outra busca ou remova os filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    isFavorite={favorites.includes(prompt.id)}
                    onToggleFavorite={toggleFavorite}
                    onOpen={openPrompt}
                    width="w-full"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <PromptDrawer
        prompt={activePrompt}
        isFavorite={activePrompt ? favorites.includes(activePrompt.id) : false}
        onToggleFavorite={toggleFavorite}
        onClose={() => setActivePrompt(null)}
      />
    </div>
  );
}
