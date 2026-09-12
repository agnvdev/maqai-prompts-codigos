"use client";

import { useCallback, useSyncExternalStore } from "react";

const FAVORITES_KEY = "maqai:favorites";
const RECENTS_KEY = "maqai:recents";
const RECENTS_LIMIT = 8;

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // localStorage indisponível (modo privado, quota etc.) — ignora silenciosamente
  }
}

const EMPTY_LIST: string[] = [];

function createListStore(key: string) {
  let cache: string[] | null = null;
  const listeners = new Set<() => void>();

  function getSnapshot(): string[] {
    if (cache === null) cache = readList(key);
    return cache;
  }

  function getServerSnapshot(): string[] {
    return EMPTY_LIST;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function set(next: string[]) {
    cache = next;
    writeList(key, next);
    listeners.forEach((listener) => listener());
  }

  return { getSnapshot, getServerSnapshot, subscribe, set };
}

const favoritesStore = createListStore(FAVORITES_KEY);
const recentsStore = createListStore(RECENTS_KEY);

export function useFavorites() {
  const favorites = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot
  );

  const toggleFavorite = useCallback((id: string) => {
    const current = favoritesStore.getSnapshot();
    const next = current.includes(id)
      ? current.filter((f) => f !== id)
      : [...current, id];
    favoritesStore.set(next);
  }, []);

  return { favorites, toggleFavorite };
}

export function useRecents() {
  const recents = useSyncExternalStore(
    recentsStore.subscribe,
    recentsStore.getSnapshot,
    recentsStore.getServerSnapshot
  );

  const addRecent = useCallback((id: string) => {
    const current = recentsStore.getSnapshot();
    const next = [id, ...current.filter((r) => r !== id)].slice(0, RECENTS_LIMIT);
    recentsStore.set(next);
  }, []);

  return { recents, addRecent };
}
