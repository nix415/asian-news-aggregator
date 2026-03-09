import { useState, useEffect, useCallback, useRef } from "react";
import type { Article } from "../types";

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
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

      try {
        const res = await fetch("/api/articles/cached");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            setArticles(data);
            hasCached.current = true;
          }
        }
      } catch {
        // cached fetch failed, will fall through to live
      }

      if (!cancelled) setLoading(false);

      if (!cancelled) {
        setRefreshing(true);
        await fetchLive(false);
        if (!cancelled) setRefreshing(false);
      }
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
