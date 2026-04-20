import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Article, CategoryName } from "../types";
import { CATEGORIES } from "../lib/constants";
import CategoryCard from "../components/CategoryCard";

interface Props {
  articles: Article[];
  loading: boolean;
  dark: boolean;
  onToggleDark: () => void;
}

export default function Landing({ articles, loading, dark, onToggleDark }: Props) {
  const buckets = groupByCategory(articles);
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);
  const pendingPath = useRef<string | null>(null);

  const handleNavigate = useCallback((path: string) => {
    if (exiting) return;
    pendingPath.current = path;
    setExiting(true);
    setTimeout(() => navigate(path), 420);
  }, [exiting, navigate]);

  return (
    <div className={`min-h-screen flex flex-col items-center pt-[18vh] pb-[6vh] px-8 relative max-sm:px-4 max-sm:pb-[80px] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${exiting ? "opacity-0 scale-[0.97] -translate-y-5" : ""}`}>
      {/* Dark mode toggle (mobile only; desktop uses DesktopNav) */}
      <button
        onClick={onToggleDark}
        className="absolute top-5 right-8 flex items-center justify-center w-9 h-9 bg-surface border border-line text-mid cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary active:scale-[0.95] rounded-full z-10 max-sm:right-4 sm:hidden"
        title={dark ? "Light mode" : "Dark mode"}
      >
        {dark ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </button>

      <h1 className="font-[system-ui,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Helvetica_Neue',sans-serif] text-[clamp(52px,8vw,110px)] font-bold tracking-[0.08em] leading-[0.95] text-center text-primary animate-hero-in select-none uppercase mb-2">
        ASIAN{" "}
        <span className="gradient-text font-sans text-[clamp(10px,1.4vw,16px)] font-medium tracking-[3px] uppercase mx-1.5 relative -top-[0.15em]">
          news
        </span>{" "}
        FOUNDED
      </h1>

      <p className="font-sans text-[clamp(11px,1.5vw,14px)] italic text-muted text-center tracking-[0.3px] animate-hero-in-delay mb-[clamp(32px,5vh,56px)]">
        Your roundup of business, news, &amp; the new.
      </p>

      {/* Category grid — 4 columns desktop, 2 on tablet/mobile */}
      <div className="cat-grid animate-hero-in-delay">
        {CATEGORIES.map((cat, i) => (
          <CategoryCard
            key={cat}
            category={cat}
            articles={buckets[cat]}
            loading={loading}
            index={i}
            onNavigate={handleNavigate}
          />
        ))}
      </div>

      {/* Watermark */}
      <p className="font-display text-[11px] tracking-[2.5px] text-[#d8d4cf] text-center mt-[clamp(32px,5vh,56px)] select-none animate-hero-in-late uppercase">
        asian founded
      </p>
    </div>
  );
}

function groupByCategory(articles: Article[]): Record<CategoryName, Article[]> {
  const buckets: Record<CategoryName, Article[]> = {
    "Brand & Founder": [],
    Culture: [],
    Community: [],
    "Lifestyle & New Openings": [],
  };

  for (const a of articles) {
    const cat = (a.category || "Community") as CategoryName;
    (buckets[cat] || buckets["Community"]).push(a);
  }

  return buckets;
}
