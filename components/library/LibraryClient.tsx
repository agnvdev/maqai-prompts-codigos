"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Prompt, PromptType } from "@/lib/types";
import { useFavorites, useRecents } from "@/lib/hooks";
import {
  getPromptsByIds,
  getPromptsPage,
  getSectionCount,
  getSectionPrompts,
  type PromptPage,
  type SectionKind,
} from "@/lib/supabase/catalog";
import type { PromptDefaultImagesMap } from "@/lib/supabase/promptDefaults";
import { slugFromType, DEFAULT_TAB_TYPE } from "@/lib/typeSlug";
import { Brand } from "@/components/ui/Brand";
import { SignOutButton } from "@/components/library/SignOutButton";
import { SearchBar } from "@/components/library/SearchBar";
import { FilterChips, type FilterValue } from "@/components/library/FilterChips";
import { TypeTabs } from "@/components/library/TypeTabs";
import { FavoritesToggle } from "@/components/library/FavoritesToggle";
import { Section } from "@/components/library/Section";
import { PromptCard } from "@/components/library/PromptCard";
import { PromptDrawer } from "@/components/library/PromptDrawer";

const SEARCH_DEBOUNCE_MS = 300;
const GRID_PAGE_SIZE = 24;

// "Ver todos" target: either one catalog section or the whole catalog,
// always within the active type (see REGRA OBRIGATÓRIA: never mix
// types in a section, count, or "Ver todos"). `total` is the real count
// from the server (Supabase `count: "exact"`), used for the "20 de 203"
// progress label — not derived from loaded rows.
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

// Only used for the favorites-only view (see below): the favorited set
// is small and fetched by id, so search/category narrowing happens in
// memory instead of a server query - these mirror the same predicates
// getPromptsPage applies server-side (title/description/code/prompt
// ilike; tags contains the category), just run client-side.
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

function matchesCategoryFilter(prompt: Prompt, filter: FilterValue): boolean {
  return filter === "Todos" || prompt.tags.includes(filter);
}

// Each home section paginates on its own (bounded query + "carregar
// mais"), so browsing the home view never fetches or renders more than
// a couple dozen cards per section, regardless of catalog size.
//
// Re-fetches whenever `type` changes (a tab switch), not just once: the
// `seedKey` ref tracks which exact (kind, type) combo `items` currently
// holds, so the SSR-provided `initial` page is used as-is on mount but
// any later change to `type` always goes back to the server instead of
// silently keeping stale, wrong-type cards.
function useSection(kind: SectionKind, type: PromptType, enabled: boolean, initial?: PromptPage) {
  const seedKey = useRef<string | null>(initial ? `${kind}:${type}` : null);
  const [items, setItems] = useState<Prompt[]>(initial?.items ?? []);
  const [hasMore, setHasMore] = useState(initial?.hasMore ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const key = `${kind}:${type}`;
    if (seedKey.current === key) return;
    seedKey.current = key;
    setLoading(true);
    getSectionPrompts({ kind, type })
      .then((page) => {
        setItems(page.items);
        setHasMore(page.hasMore);
      })
      .catch((error) => console.error(`Failed to load section "${kind}" (${type}):`, error))
      .finally(() => setLoading(false));
  }, [enabled, kind, type]);

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    try {
      const page = await getSectionPrompts({ kind, type, offset: items.length });
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error(`Failed to load more of section "${kind}" (${type}):`, error);
    } finally {
      setLoading(false);
    }
  }

  return { items, hasMore, loading, loadMore };
}

export function LibraryClient({
  initialType,
  typeCounts = {},
  initialSections = {},
  sectionCounts = {},
  defaultImagesMap = {},
  logoUrl,
  initialCategoryView = null,
}: {
  initialType: PromptType;
  typeCounts?: Partial<Record<PromptType, number>>;
  initialSections?: Partial<Record<SectionKind, PromptPage>>;
  sectionCounts?: Partial<Record<SectionKind, number>>;
  defaultImagesMap?: PromptDefaultImagesMap;
  logoUrl?: string | null;
  // Set by app/app/(protected)/secao/[kind]/page.tsx so "Ver todos" is a
  // real, shareable URL instead of only client-side state - seeds the
  // exact same categoryView the button used to set directly on click.
  initialCategoryView?: CategoryView | null;
}) {
  const router = useRouter();
  // Captured once at mount (lazy initializer, not a ref - this needs to
  // be readable during render, e.g. in effectiveSectionCounts below).
  // Stays pointed at the type this instance's SSR data was fetched for,
  // even as `activeType` changes on tab switches.
  const [initialTypeSeed] = useState(() => initialType);
  const [activeType, setActiveType] = useState<PromptType>(initialType);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("Todos");
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [categoryView, setCategoryView] = useState<CategoryView | null>(initialCategoryView);
  // Separate from `filter` on purpose - favorites is a personal,
  // cross-cutting dimension, not a taxonomy value, so it composes with
  // both the active type tab and the active category chip instead of
  // being one more option inside FilterChips (see selectFavoritesOnly,
  // which deliberately never resets `filter`/`query`, and selectType/
  // selectQuery/selectFilter, which deliberately never reset this).
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { favorites, toggleFavorite } = useFavorites();
  const { recents, addRecent } = useRecents();

  const isBrowsingHome = filter === "Todos" && debouncedQuery.trim() === "" && !showFavoritesOnly;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const sections: Record<SectionKind, ReturnType<typeof useSection>> = {
    comeceAqui: useSection("comeceAqui", activeType, isBrowsingHome, initialSections.comeceAqui),
    maisUsados: useSection("maisUsados", activeType, isBrowsingHome, initialSections.maisUsados),
    codigosVirais: useSection("codigosVirais", activeType, isBrowsingHome, initialSections.codigosVirais),
    maquinasPesadas: useSection("maquinasPesadas", activeType, isBrowsingHome, initialSections.maquinasPesadas),
    agro: useSection("agro", activeType, isBrowsingHome, initialSections.agro),
    mineracao: useSection("mineracao", activeType, isBrowsingHome, initialSections.mineracao),
    combos: useSection("combos", activeType, isBrowsingHome, initialSections.combos),
  };

  // The SSR-provided sectionCounts are only valid for initialType - once
  // the user switches tabs, re-fetch all 7 counts scoped to the new
  // type so the "(N)" / "X de Y" numbers next to each section never lag
  // behind a type switch.
  const [dynamicSectionCounts, setDynamicSectionCounts] = useState<Partial<Record<SectionKind, number>>>({});
  useEffect(() => {
    // Nothing to fetch when back on the original type - the derived
    // effectiveSectionCounts below already ignores dynamicSectionCounts
    // in that case, so there's no stale value to clear either.
    if (activeType === initialTypeSeed) return;
    let cancelled = false;
    Promise.all(SECTION_ORDER.map((kind) => getSectionCount(kind, activeType)))
      .then((counts) => {
        if (cancelled) return;
        setDynamicSectionCounts(Object.fromEntries(SECTION_ORDER.map((kind, i) => [kind, counts[i]])));
      })
      .catch((error) => console.error("Failed to load section counts:", error));
    return () => {
      cancelled = true;
    };
  }, [activeType, initialTypeSeed]);
  const effectiveSectionCounts = activeType === initialTypeSeed ? sectionCounts : dynamicSectionCounts;

  // "Vistos recentemente": bounded to a handful of ids (see RECENTS_LIMIT
  // in lib/hooks.ts), fetched by id instead of filtered from a full list.
  // Filtered down to the active type client-side (the id list itself is
  // never type-scoped, since a user can favorite/view across all 3
  // tabs) so this section never mixes types either.
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
  const visibleRecents = recentPrompts.filter((p) => p.type === activeType);

  // Grid view: search and/or a filter chip, always within the active
  // type. "Favoritos" is id-bound (the favorited set is inherently
  // small) so it's fetched once and searched/type-filtered in memory;
  // every other filter/search goes through a paginated, indexed
  // Supabase query.
  const [gridItems, setGridItems] = useState<Prompt[]>([]);
  const [gridHasMore, setGridHasMore] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);

  useEffect(() => {
    if (isBrowsingHome) return;
    let cancelled = false;

    async function run() {
      setGridLoading(true);
      try {
        if (showFavoritesOnly) {
          const items = await getPromptsByIds(favorites);
          const filtered = items.filter(
            (p) => p.type === activeType && matchesSearch(p, debouncedQuery) && matchesCategoryFilter(p, filter),
          );
          if (cancelled) return;
          setGridItems(filtered);
          setGridHasMore(false);
          return;
        }

        const page = await getPromptsPage({
          search: debouncedQuery,
          filter,
          type: activeType,
          offset: 0,
          limit: GRID_PAGE_SIZE,
        });

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
  }, [isBrowsingHome, filter, debouncedQuery, activeType, showFavoritesOnly, favorites]);

  async function loadMoreGrid() {
    if (gridLoading || showFavoritesOnly) return;
    setGridLoading(true);
    try {
      const page = await getPromptsPage({
        search: debouncedQuery,
        filter,
        type: activeType,
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
  // whole catalog) *and* the active type, independent from the
  // search/filter grid above. Same bounded-query + "Carregar mais"
  // pattern — never fetches or renders the full catalog at once.
  // categoryView is always cleared on a type switch (see selectType), so
  // activeType here is always the type this view was opened for.
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
            ? await getPromptsPage({ type: activeType, offset: 0, limit: GRID_PAGE_SIZE })
            : await getSectionPrompts({
                kind: categoryView!.kind as SectionKind,
                type: activeType,
                offset: 0,
                limit: GRID_PAGE_SIZE,
              });
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
  }, [categoryView, activeType]);

  async function loadMoreView() {
    if (viewLoading || !categoryView) return;
    setViewLoading(true);
    try {
      const page =
        categoryView.kind === "all"
          ? await getPromptsPage({ type: activeType, offset: viewItems.length, limit: GRID_PAGE_SIZE })
          : await getSectionPrompts({
              kind: categoryView.kind as SectionKind,
              type: activeType,
              offset: viewItems.length,
              limit: GRID_PAGE_SIZE,
            });
      setViewItems((prev) => [...prev, ...page.items]);
      setViewHasMore(page.hasMore);
    } catch (error) {
      console.error("Failed to load more of category view:", error);
    } finally {
      setViewLoading(false);
    }
  }

  function homeHref(type: PromptType) {
    return type === DEFAULT_TAB_TYPE ? "/app" : `/app?tipo=${slugFromType(type)}`;
  }

  function selectType(type: PromptType) {
    if (type === activeType) return;
    setCategoryView(null);
    setActiveType(type);
    router.replace(homeHref(type), { scroll: false });
  }

  function selectQuery(value: string) {
    setCategoryView(null);
    setQuery(value);
  }

  function selectFilter(value: FilterValue) {
    setCategoryView(null);
    setFilter(value);
  }

  // Deliberately does not touch `filter`/`query` - toggling favorites
  // combines with whatever category/search is already active instead of
  // replacing it ("manter categorias secundárias funcionando junto").
  function selectFavoritesOnly() {
    setCategoryView(null);
    setShowFavoritesOnly((prev) => !prev);
  }

  function openPrompt(prompt: Prompt) {
    setActivePrompt(prompt);
    addRecent(prompt.id);
  }

  const viewAllAllHref = `/app/secao/todos?tipo=${slugFromType(activeType)}`;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Brand logoUrl={logoUrl} />
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              ← Início
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pb-4 sm:px-6">
          <TypeTabs active={activeType} counts={typeCounts} onChange={selectType} />

          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchBar value={query} onChange={selectQuery} />
            </div>
            <FavoritesToggle active={showFavoritesOnly} onToggle={selectFavoritesOnly} count={favorites.length} />
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <FilterChips active={filter} onChange={selectFilter} />
            </div>
            <Link
              href={viewAllAllHref}
              className="shrink-0 text-xs font-semibold text-accent transition-colors duration-200 hover:underline"
            >
              Ver todos
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 py-6">
        {categoryView ? (
          <div className="flex flex-col gap-4 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => router.push(homeHref(activeType))}
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
            {visibleRecents.length > 0 && (
              <Section
                title="Vistos recentemente"
                prompts={visibleRecents}
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
                count={effectiveSectionCounts[kind]}
                prompts={sections[kind].items}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onOpen={openPrompt}
                hasMore={sections[kind].hasMore}
                loadingMore={sections[kind].loading}
                onLoadMore={sections[kind].loadMore}
                onViewAll={() => router.push(`/app/secao/${kind}?tipo=${slugFromType(activeType)}`)}
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
              showFavoritesOnly ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 py-16 text-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-muted" aria-hidden="true">
                    <path
                      d="M12 21s-7.5-4.6-10-9.1C0.3 8.2 2 4.5 5.6 4c2.1-.3 4 .8 6.4 3.4C14.4 4.8 16.3 3.7 18.4 4c3.6.5 5.3 4.2 3.6 7.9C19.5 16.4 12 21 12 21Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="font-medium text-foreground">Nenhum favorito ainda</p>
                  <p className="text-sm text-muted">
                    Toque no coração de um prompt para guardá-lo aqui.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 py-16 text-center">
                  <p className="font-medium text-foreground">Nenhum prompt encontrado</p>
                  <p className="text-sm text-muted">
                    Tente outra busca ou remova os filtros aplicados.
                  </p>
                </div>
              )
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
