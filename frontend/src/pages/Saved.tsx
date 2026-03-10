import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Article } from "../types";
import ArticleCard from "../components/ArticleCard";
import Breadcrumbs from "../components/Breadcrumbs";

interface Props {
  articles: Article[];
  loading: boolean;
  isBookmarked: (link: string) => boolean;
  onToggleBookmark: (link: string) => void;
}

export default function Saved({
  articles,
  loading,
  isBookmarked,
  onToggleBookmark,
}: Props) {
  const navigate = useNavigate();

  const saved = useMemo(
    () =>
      articles
        .filter((a) => isBookmarked(a.link))
        .sort(
          (a, b) => (b.popularity_score || 0) - (a.popularity_score || 0),
        ),
    [articles, isBookmarked],
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-[160px] flex items-end px-10 pb-6 border-b border-line max-sm:px-4">
        <div className="absolute inset-0 overlay-gradient-r" />

        <div className="absolute top-5 left-10 z-10 flex flex-col gap-1 max-sm:left-4">
          <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Saved" }]} />
          <button
            className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.5px] text-muted bg-transparent border-none p-0 cursor-pointer transition-all duration-200 hover:text-primary hover:-translate-x-[3px] w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded"
            onClick={() => navigate("/")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
        </div>

        <div className="relative z-[1] flex items-end justify-between w-full max-w-[1520px] mx-auto">
          <div>
            <span className="block text-[9px] font-bold tracking-[2px] uppercase text-muted mb-1">
              Your Collection
            </span>
            <h2 className="font-serif text-[clamp(36px,5vw,56px)] text-primary leading-none">
              Saved Articles
            </h2>
          </div>
          <span className="text-[11px] text-muted tracking-[0.5px]">
            {saved.length} saved
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1520px] mx-auto px-10 pt-7 pb-40 max-sm:px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3.5">
            <div className="w-7 h-7 border-[1.5px] border-line border-t-primary rounded-full animate-spin" />
            <p className="text-[11px] tracking-[1.2px] uppercase text-muted">
              Loading articles
            </p>
          </div>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-muted"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            <p className="text-[13px] text-muted tracking-[0.3px]">
              No saved articles yet. Bookmark articles to see them here.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-2 text-[11px] font-semibold tracking-[0.8px] uppercase bg-primary text-surface border-none px-5 py-2.5 cursor-pointer transition-all duration-150 hover:bg-primary/90"
            >
              Browse Articles
            </button>
          </div>
        ) : (
          <div className="masonry-grid">
            {saved.map((article, i) => (
              <ArticleCard
                key={article.link}
                article={article}
                index={i}
                bookmarked={true}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
