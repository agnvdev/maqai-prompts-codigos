"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Prompt } from "@/lib/types";
import { useFavorites, useRecents } from "@/lib/hooks";
import {
  getPromptsByIds,
  getPromptsPage,
  getSectionPrompts,
  type PromptPage,
  type SectionKind,
} from "@/lib/supabase/catalog";
import type { PromptDefaultImagesMap } from "@/lib/supabase/promptDefaults";
import { Brand } from "@/components/ui/Brand";
import { SearchBar } from "@/components/library/SearchBar";
import { FilterChips, type FilterValue } from "@/components/library/FilterChips";
import { Section } from "@/components/library/Section";
import { PromptCard } from "@/components/library/PromptCard";
import { PromptDrawer } from "@/components/library/PromptDrawer";

const SEARCH_DEBOUNCE_MS = 300;
const GRID_PAGE_SIZE = 24;

// "Ver todos" target: either one catalog section or the whole catalog.
// `total` is the real count from the server (Supabase `count: "exact"`),
// used for the "20 de 203" progress label — not derived from loaded rows.
type CategoryView = { kind: SectionKind | "all"; title: string; total?: number };

const SECTION_TITLES: Record<SectionKind, string> = {
  comeceAqui: "Comece aqui",
  maisUsados: "Mais usados",
  codigosVirais: "Códigos virais",
  maquinasPesadas: "Máquinas pesadas",
  agro: "Agro",
  mineracao: "Mineração",
  combos: "Combos",
};

const SECTION_ORDER: SectionKind[] = [
  "comeceAqui",
  "maisUsados",
  "codigosVirais",
  "maquinasPesadas",
  "agro",
  "mineracao",
  "combos",
];

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

// Each home section paginates on its own (bounded query + "carregar
// mais"), so browsing the home view never fetches or renders more than
// a couple dozen cards per section, regardless of catalog size.
function useSection(kind: SectionKind, enabled: boolean, initial?: PromptPage) {
  const [items, setItems] = useState<Prompt[]>(initial?.items ?? []);
  const [hasMore, setHasMore] = useState(initial?.hasMore ?? false);
  const [loading, setLoading] = useState(false);
  const fetchedInitial = useRef(Boolean(initial));

  useEffect(() => {
    if (!enabled || fetchedInitial.current) return;
    fetchedInitial.current = true;
    setLoading(true);
    getSectionPrompts({ kind })
      .then((page) => {
        setItems(page.items);
        setHasMore(page.hasMore);
      })
      .catch((error) => console.error(`Failed to load section "${kind}":`, error))
      .finally(() => setLoading(false));
  }, [enabled, kind]);

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    try {
      const page = await getSectionPrompts({ kind, offset: items.length });
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error(`Failed to load more of section "${kind}":`, error);
    } finally {
      setLoading(false);
    }
  }

  return { items, hasMore, loading, loadMore };
}

export function LibraryClient({
  initialSections = {},
  sectionCounts = {},
  totalCount,
  defaultImagesMap = {},
  logoUrl,
}: {
  initialSections?: Partial<Record<SectionKind, PromptPage>>;
  sectionCounts?: Partial<Record<SectionKind, number>>;
  totalCount?: number;
  defaultImagesMap?: PromptDefaultImagesMap;
  logoUrl?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("Todos");
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [categoryView, setCategoryView] = useState<CategoryView | null>(null);

  const { favorites, toggleFavorite } = useFavorites();
  const { recents, addRecent } = useRecents();

  const isBrowsingHome = filter === "Todos" && debouncedQuery.trim() === "";

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const sections: Record<SectionKind, ReturnType<typeof useSection>> = {
    comeceAqui: useSection("comeceAqui", isBrowsingHome, initialSections.comeceAqui),
    maisUsados: useSection("maisUsados", isBrowsingHome, initialSections.maisUsados),
    codigosVirais: useSection("codigosVirais", isBrowsingHome, initialSections.codigosVirais),
    maquinasPesadas: useSection("maquinasPesadas", isBrowsingHome, initialSections.maquinasPesadas),
    agro: useSection("agro", isBrowsingHome, initialSections.agro),
    mineracao: useSection("mineracao", isBrowsingHome, initialSections.mineracao),
    combos: useSection("combos", isBrowsingHome, initialSections.combos),
  };

  // "Vistos recentemente": bounded to a handful of ids (see RECENTS_LIMIT
  // in lib/hooks.ts), fetched by id instead of filtered from a full list.
  const [recentPrompts, setRecentPrompts] = useState<Prompt[]>([]);
  useEffect(() => {
    if (!isBrowsingHome || recents.length === 0) return;
    let cancelled = false;
    getPromptsByIds(recents)
      .then((items) => {
        if (!cancelled) setRecentPrompts(items);
      })
      .catch((error) => console.error("Failed to load recent prompts:", error));
    return () => {
      cancelled = true;
    };
  }, [isBrowsingHome, recents]);

  // Grid view: search and/or a filter chip. "Favoritos" is id-bound (the
  // favorited set is inherently small) so it's fetched once and searched
  // in memory; every other filter/search goes through a paginated,
  // indexed Supabase query.
  const [gridItems, setGridItems] = useState<Prompt[]>([]);
  const [gridHasMore, setGridHasMore] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);

  useEffect(() => {
    if (isBrowsingHome) return;
    let cancelled = false;

    async function run() {
      setGridLoading(true);
      try {
        const page =
          filter === "Favoritos"
            ? {
                items: (await getPromptsByIds(favorites)).filter((p) => matchesSearch(p, debouncedQuery)),
                hasMore: false,
              }
            : await getPromptsPage({ search: debouncedQuery, filter, offset: 0, limit: GRID_PAGE_SIZE });

        if (cancelled) return;
        setGridItems(page.items);
        setGridHasMore(page.hasMore);
      } catch (error) {
        console.error("Failed to search prompts:", error);
      } finally {
        if (!cancelled) setGridLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [isBrowsingHome, filter, debouncedQuery, favorites]);

  async function loadMoreGrid() {
    if (gridLoading || filter === "Favoritos") return;
    setGridLoading(true);
    try {
      const page = await getPromptsPage({
        search: debouncedQuery,
        filter,
        offset: gridItems.length,
        limit: GRID_PAGE_SIZE,
      });
      setGridItems((prev) => [...prev, ...page.items]);
      setGridHasMore(page.hasMore);
    } catch (error) {
      console.error("Failed to load more search results:", error);
    } finally {
      setGridLoading(false);
    }
  }

  // "Ver todos": a dedicated paginated view scoped to one section (or the
  // whole catalog), independent from the search/filter grid above. Same
  // bounded-query + "Carregar mais" pattern — never fetches or renders the
  // full 512-prompt catalog at once.
  const [viewItems, setViewItems] = useState<Prompt[]>([]);
  const [viewHasMore, setViewHasMore] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    if (!categoryView) return;
    let cancelled = false;

    async function run() {
      setViewLoading(true);
      try {
        const page =
          categoryView!.kind === "all"
            ? await getPromptsPage({ offset: 0, limit: GRID_PAGE_SIZE })
            : await getSectionPrompts({ kind: categoryView!.kind as SectionKind, offset: 0, limit: GRID_PAGE_SIZE });
        if (cancelled) return;
        setViewItems(page.items);
        setViewHasMore(page.hasMore);
      } catch (error) {
        console.error("Failed to load category view:", error);
      } finally {
        if (!cancelled) setViewLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [categoryView]);

  async function loadMoreView() {
    if (viewLoading || !categoryView) return;
    setViewLoading(true);
    try {
      const page =
        categoryView.kind === "all"
          ? await getPromptsPage({ offset: viewItems.length, limit: GRID_PAGE_SIZE })
          : await getSectionPrompts({ kind: categoryView.kind as SectionKind, offset: viewItems.length, limit: GRID_PAGE_SIZE });
      setViewItems((prev) => [...prev, ...page.items]);
      setViewHasMore(page.hasMore);
    } catch (error) {
      console.error("Failed to load more of category view:", error);
    } finally {
      setViewLoading(false);
    }
  }

  function selectQuery(value: string) {
    setCategoryView(null);
    setQuery(value);
  }

  function selectFilter(value: FilterValue) {
    setCategoryView(null);
    setFilter(value);
  }

  function openPrompt(prompt: Prompt) {
    setActivePrompt(prompt);
    addRecent(prompt.id);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Brand logoUrl={logoUrl} />
          <Link
            href="/"
            className="text-xs font-medium text-muted transition-colors duration-200 hover:text-foreground"
          >
            ← Início
          </Link>
        </div>

        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <p className="text-xs font-medium text-muted">
            {totalCount != null ? `${totalCount.toLocaleString("pt-BR")} prompts disponíveis` : ""}
          </p>
          <button
            type="button"
            onClick={() => setCategoryView({ kind: "all", title: "Todos os prompts", total: totalCount })}
            className="shrink-0 text-xs font-semibold text-accent transition-colors duration-200 hover:underline"
          >
            Ver todos
          </button>
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pb-4 sm:px-6">
          <SearchBar value={query} onChange={selectQuery} />
          <FilterChips active={filter} onChange={selectFilter} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 py-6">
        {categoryView ? (
          <div className="flex flex-col gap-4 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setCategoryView(null)}
              className="w-fit text-xs font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              ← Voltar
            </button>

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold tracking-tight text-foreground">{categoryView.title}</h2>
              <p className="text-sm font-medium text-muted">
                {viewLoading && viewItems.length === 0
                  ? "Carregando..."
                  : categoryView.total != null
                    ? `${viewItems.length} de ${categoryView.total}`
                    : `${viewItems.length}${viewHasMore ? "+" : ""} prompts`}
              </p>
            </div>

            {viewItems.length === 0 && !viewLoading ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 py-16 text-center">
                <p className="font-medium text-foreground">Nenhum prompt encontrado</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {viewItems.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      isFavorite={favorites.includes(prompt.id)}
                      onToggleFavorite={toggleFavorite}
                      onOpen={openPrompt}
                      width="w-full"
                      defaultImagesMap={defaultImagesMap}
                    />
                  ))}
                </div>

                {viewHasMore && (
                  <button
                    type="button"
                    onClick={loadMoreView}
                    disabled={viewLoading}
                    className="mx-auto w-fit rounded-lg border border-accent px-6 py-3 text-sm font-semibold text-accent transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-[0.97] disabled:opacity-60"
                  >
                    {viewLoading ? "Carregando..." : "Carregar mais"}
                  </button>
                )}
              </>
            )}
          </div>
        ) : isBrowsingHome ? (
          <>
            {recentPrompts.length > 0 && (
              <Section
                title="Vistos recentemente"
                prompts={recentPrompts}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onOpen={openPrompt}
                defaultImagesMap={defaultImagesMap}
              />
            )}
            {SECTION_ORDER.map((kind) => (
              <Section
                key={kind}
                title={SECTION_TITLES[kind]}
                count={sectionCounts[kind]}
                prompts={sections[kind].items}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onOpen={openPrompt}
                hasMore={sections[kind].hasMore}
                loadingMore={sections[kind].loading}
                onLoadMore={sections[kind].loadMore}
                onViewAll={() => setCategoryView({ kind, title: SECTION_TITLES[kind], total: sectionCounts[kind] })}
                defaultImagesMap={defaultImagesMap}
              />
            ))}
          </>
        ) : (
          <div className="flex flex-col gap-4 px-4 sm:px-6">
            <h2 className="text-sm font-medium tracking-tight text-muted">
              {gridLoading && gridItems.length === 0
                ? "Buscando..."
                : `${gridItems.length}${gridHasMore ? "+" : ""} ${
                    gridItems.length === 1 ? "resultado encontrado" : "resultados encontrados"
                  }`}
            </h2>

            {gridItems.length === 0 && !gridLoading ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 py-16 text-center">
                <p className="font-medium text-foreground">Nenhum prompt encontrado</p>
                <p className="text-sm text-muted">
                  Tente outra busca ou remova os filtros aplicados.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {gridItems.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      isFavorite={favorites.includes(prompt.id)}
                      onToggleFavorite={toggleFavorite}
                      onOpen={openPrompt}
                      width="w-full"
                      defaultImagesMap={defaultImagesMap}
                    />
                  ))}
                </div>

                {gridHasMore && (
                  <button
                    type="button"
                    onClick={loadMoreGrid}
                    disabled={gridLoading}
                    className="mx-auto w-fit rounded-lg border border-accent px-6 py-3 text-sm font-semibold text-accent transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-[0.97] disabled:opacity-60"
                  >
                    {gridLoading ? "Carregando..." : "Carregar mais"}
                  </button>
                )}
              </>
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
