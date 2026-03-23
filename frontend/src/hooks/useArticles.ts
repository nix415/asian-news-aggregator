import { useState, useEffect, useCallback, useRef } from "react";
import type { Article } from "../types";

const LOCAL_STORAGE_KEY = "anf-articles-cache";
const LOCAL_STORAGE_TS_KEY = "anf-articles-cache-ts";
const LOCAL_CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

function readLocalCache(): Article[] | null {
  try {
    const ts = localStorage.getItem(LOCAL_STORAGE_TS_KEY);
    if (!ts || Date.now() - Number(ts) > LOCAL_CACHE_MAX_AGE_MS) return null;
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

function writeLocalCache(articles: Article[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(articles));
    localStorage.setItem(LOCAL_STORAGE_TS_KEY, String(Date.now()));
  } catch {
    // localStorage full or unavailable
  }
}

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>(() => readLocalCache() ?? []);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveMode, setArchiveMode] = useState(false);
  const hasCached = useRef(false);

  const fetchLive = useCallback(async (archive: boolean) => {
    const endpoint = archive ? "/api/archive" : "/api/articles";
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setArticles(data);
        writeLocalCache(data);
      }
    } catch (e) {
      if (!hasCached.current) {
        setError(e instanceof Error ? e.message : "Failed to load articles");
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      hasCached.current = false;

      if (archiveMode) {
        await fetchLive(true);
        if (!cancelled) setLoading(false);
        return;
      }

      const localData = readLocalCache();
      if (localData) {
        setArticles(localData);
        hasCached.current = true;
      }

      try {
        const res = await fetch("/api/articles/cached");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            setArticles(data);
            writeLocalCache(data);
            hasCached.current = true;
          }
        }
      } catch {
        // cached fetch failed; localStorage data (if any) is already rendered
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [archiveMode, fetchLive]);

  const toggleArchive = useCallback(() => {
    setArchiveMode((prev) => !prev);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLive(archiveMode);
    setRefreshing(false);
  }, [archiveMode, fetchLive]);

  return {
    articles,
    loading,
    refreshing,
    error,
    archiveMode,
    toggleArchive,
    refresh,
  };
}
