import { useState, useCallback } from "react";

const STORAGE_KEY = "anf-bookmarks";

function loadBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persist(links: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...links]));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks);

  const toggle = useCallback((link: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(link)) next.delete(link);
      else next.add(link);
      persist(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (link: string) => bookmarks.has(link),
    [bookmarks],
  );

  return { bookmarks, toggle, isBookmarked };
}
