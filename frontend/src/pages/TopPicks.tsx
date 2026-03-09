import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Article } from "../types";
import ArticleCard from "../components/ArticleCard";

interface Props {
  articles: Article[];
  loading: boolean;
  isBookmarked: (link: string) => boolean;
  onToggleBookmark: (link: string) => void;
}

const TOP_PICKS_COUNT = 20;

export default function TopPicks({
  articles,
  loading,
  isBookmarked,
  onToggleBookmark,
}: Props) {
  const navigate = useNavigate();

  const picks = useMemo(() => {
    return articles
      .filter((a) => a.image && (a.popularity_score || 0) >= 45)
      .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
      .slice(0, TOP_PICKS_COUNT);
  }, [articles]);

  const igReadyCount = picks.filter(
    (a) => (a.popularity_score || 0) >= 80,
  ).length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-[180px] overflow-hidden flex items-end px-10 pb-6 border-b border-line max-sm:px-4">
        {picks[0]?.image && (
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
            src={picks[0].image}
            alt=""
          />
        )}
        <div className="absolute inset-0 overlay-gradient-r" />

        <button
          className="absolute top-5 left-10 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.5px] text-muted bg-transparent border-none p-0 cursor-pointer transition-all duration-200 z-10 hover:text-primary hover:-translate-x-[3px] max-sm:left-4"
          onClick={() => navigate("/")}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>

        <div className="relative z-[1] flex items-end justify-between w-full max-w-[1520px] mx-auto">
          <div>
            <span className="block text-[9px] font-bold tracking-[2px] uppercase text-muted mb-1">
              Across All Categories
            </span>
            <h2 className="font-serif text-[clamp(36px,5vw,64px)] text-primary leading-none">
              Top Picks for IG
            </h2>
          </div>
          <span className="text-[11px] text-muted tracking-[0.5px]">
            {picks.length} articles with images
          </span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-[1520px] mx-auto px-10 py-4 flex items-center gap-6 border-b border-line max-sm:px-4">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[22px] text-primary">
            {igReadyCount}
          </span>
          <span className="text-[10px] text-muted uppercase tracking-[1px] font-semibold">
            IG Ready
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[22px] text-primary">
            {picks.length}
          </span>
          <span className="text-[10px] text-muted uppercase tracking-[1px] font-semibold">
            Total Picks
          </span>
        </div>
        <div className="ml-auto text-[10px] text-muted tracking-[0.5px]">
          Sorted by engagement potential
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1520px] mx-auto px-10 pt-7 pb-40 max-sm:px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3.5">
            <div className="w-7 h-7 border-[1.5px] border-line border-t-primary rounded-full animate-spin" />
            <p className="text-[11px] tracking-[1.2px] uppercase text-muted">
              Finding top picks
            </p>
          </div>
        ) : picks.length === 0 ? (
          <div className="p-10 text-center text-[12px] text-muted border border-dashed border-line tracking-[0.5px]">
            No articles with images found. Try refreshing.
          </div>
        ) : (
          <div className="masonry-grid">
            {picks.map((article, i) => (
              <ArticleCard
                key={article.link}
                article={article}
                index={i}
                bookmarked={isBookmarked(article.link)}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
