import { useState, useEffect, useCallback } from "react";
import type { Article } from "../types";

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveMode, setArchiveMode] = useState(false);

  const fetchArticles = useCallback(async (archive: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = archive ? "/api/archive" : "/api/articles";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(archiveMode);
  }, [archiveMode, fetchArticles]);

  const toggleArchive = useCallback(() => {
    setArchiveMode((prev) => !prev);
  }, []);

  const refresh = useCallback(() => {
    fetchArticles(archiveMode);
  }, [archiveMode, fetchArticles]);

  return { articles, loading, error, archiveMode, toggleArchive, refresh };
}
