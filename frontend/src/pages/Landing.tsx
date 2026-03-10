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
  const navigate = useNavigate();
  const buckets = groupByCategory(articles);
  const topPicksCount = articles.filter(
    (a) => a.image && (a.popularity_score || 0) >= 45,
  ).length;

  return (
    <div className="min-h-screen flex flex-col items-center pt-[8vh] pb-[6vh] px-8 relative max-sm:pb-[80px]">
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

      <p className="font-sans text-[clamp(11px,1.5vw,14px)] italic text-muted text-center tracking-[0.3px] animate-hero-in-delay mb-6">
        Your roundup of business, news, &amp; the new.
      </p>

      {/* Quick-access buttons */}
      <div className="flex items-center gap-3 mb-[clamp(32px,5vh,56px)] animate-hero-in-delay">
        <button
          onClick={() => navigate("/top-picks")}
          className="flex items-center gap-2 bg-primary text-surface border-none px-5 py-2.5 text-[11px] font-semibold tracking-[0.8px] uppercase cursor-pointer transition-all duration-150 hover:bg-primary/90 active:scale-[0.97]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clipRule="evenodd"
            />
          </svg>
          Top Picks for IG
          {!loading && topPicksCount > 0 && (
            <span className="bg-surface/20 text-surface px-1.5 py-0.5 text-[9px] tracking-[0.5px]">
              {topPicksCount}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate("/saved")}
          className="flex items-center gap-2 bg-surface text-mid border border-line px-5 py-2.5 text-[11px] font-semibold tracking-[0.8px] uppercase cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary active:scale-[0.97]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          Saved
        </button>
      </div>

      <div className="w-full overflow-x-auto overflow-y-visible pb-2 -mx-2 px-2 scroll-smooth landing-category-scroll">
        <div className="flex flex-nowrap gap-5 min-h-0 justify-start">
          <div className="flex-shrink-0 w-[min(280px,75vw)] max-w-[320px]">
            <CategoryCard
              key="all"
              category="All"
              articles={articles}
              loading={loading}
              index={0}
              isAllArticles
            />
          </div>
          {CATEGORIES.map((cat, i) => (
            <div key={cat} className="flex-shrink-0 w-[min(280px,75vw)] max-w-[320px]">
              <CategoryCard
                category={cat}
                articles={buckets[cat]}
                loading={loading}
                index={i + 1}
              />
            </div>
          ))}
        </div>
      </div>

      <p className="font-display text-[11px] tracking-[2.5px] text-[#d8d4cf] text-center mt-[clamp(32px,5vh,56px)] select-none animate-hero-in-late">
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
