import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Article, CategoryName } from "../types";
import { CATEGORIES } from "../lib/constants";
import CategoryCard from "../components/CategoryCard";

interface Props {
  articles: Article[];
  loading: boolean;
}

export default function Landing({ articles, loading }: Props) {
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
