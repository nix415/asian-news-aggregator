import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Article, SortOption, TimeRange, CategoryName } from "../types";
import { TIME_CUTOFFS } from "../lib/utils";
import Header from "../components/Header";
import ArticleCard from "../components/ArticleCard";
import SearchBar from "../components/SearchBar";

interface Props {
  articles: Article[];
  loading: boolean;
  archiveMode: boolean;
  onToggleArchive: () => void;
  onRefresh: () => void;
  isBookmarked: (link: string) => boolean;
  onToggleBookmark: (link: string) => void;
}

export default function Category({
  articles,
  loading,
  archiveMode,
  onToggleArchive,
  onRefresh,
  isBookmarked,
  onToggleBookmark,
}: Props) {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const category = decodeURIComponent(name || "") as CategoryName;

  const [source, setSource] = useState("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [sort, setSort] = useState<SortOption>("popular");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);

  // Scroll-direction header hide/show
  useEffect(() => {
    let lastY = 0;
    const handler = () => {
      const y = window.scrollY;
      if (y < 60) setHeaderHidden(false);
      else if (y > lastY + 4) setHeaderHidden(true);
      else if (y < lastY - 4) setHeaderHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [category]);

  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const filtered = useMemo(() => {
    let list = articles.filter(
      (a) => (a.category || "Community") === category,
    );

    if (source !== "all") list = list.filter((a) => a.source === source);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        `${a.title} ${a.summary} ${a.source}`.toLowerCase().includes(q),
      );
    }

    if (timeRange !== "all") {
      const cutoff = Date.now() - (TIME_CUTOFFS[timeRange] || 0);
      list = list.filter((a) => new Date(a.published || 0).getTime() >= cutoff);
    }

    list.sort((a, b) => {
      if (sort === "popular")
        return (
          (b.popularity_score || b.trending_score || 0) -
          (a.popularity_score || a.trending_score || 0)
        );
      if (sort === "trending")
        return (b.trending_score || 0) - (a.trending_score || 0);
      if (sort === "newest")
        return (
          new Date(b.published || 0).getTime() -
          new Date(a.published || 0).getTime()
        );
      if (sort === "oldest")
        return (
          new Date(a.published || 0).getTime() -
          new Date(b.published || 0).getTime()
        );
      return 0;
    });

    return list;
  }, [articles, category, source, search, timeRange, sort]);

  const trendingCount = filtered.filter(
    (a) => (a.popularity_score || 0) >= 70,
  ).length;
  const heroImage = filtered.find((a) => a.image);

  return (
    <>
      <Header
        visible={true}
        hidden={headerHidden}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        source={source}
        onSourceChange={setSource}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        sort={sort}
        onSortChange={setSort}
        archiveMode={archiveMode}
        onToggleArchive={onToggleArchive}
      />

      {/* Hero banner */}
      <div className="relative h-[180px] overflow-hidden flex items-end px-10 pb-6 border-b border-line max-sm:px-4">
        {heroImage?.image && (
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-[0.18]"
            src={heroImage.image}
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(247,245,242,0.98)] from-35% to-[rgba(247,245,242,0.6)]" />

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
          All Categories
        </button>

        <div className="relative z-[1] flex items-end justify-between w-full max-w-[1520px] mx-auto">
          <h2 className="font-serif text-[clamp(36px,5vw,64px)] text-primary leading-none">
            {category}
          </h2>
          <span className="text-[11px] text-muted tracking-[0.5px]">
            {filtered.length} articles in this category
          </span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-[1520px] mx-auto px-10 py-4 flex items-center gap-6 border-b border-line max-sm:px-4">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[22px] text-primary">
            {filtered.length}
          </span>
          <span className="text-[10px] text-muted uppercase tracking-[1px] font-semibold">
            Articles
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[22px] text-primary">
            {trendingCount}
          </span>
          <span className="text-[10px] text-muted uppercase tracking-[1px] font-semibold">
            Trending
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold tracking-[1px] uppercase text-fresh border border-fresh/25 px-2.5 py-1">
          <div className="w-[5px] h-[5px] bg-fresh rounded-full animate-pulse-dot" />
          Live
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3.5">
          <div className="w-7 h-7 border-[1.5px] border-line border-t-primary rounded-full animate-spin" />
          <p className="text-[11px] tracking-[1.2px] uppercase text-muted">
            Loading articles
          </p>
        </div>
      )}

      {/* Article grid */}
      {!loading && (
        <div className="max-w-[1520px] mx-auto px-10 pt-7 pb-40 max-sm:px-4">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-[12px] text-muted border border-dashed border-line tracking-[0.5px]">
              No articles found for these filters.
            </div>
          ) : (
            <div className="masonry-grid">
              {filtered.map((article, i) => (
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
      )}

      <SearchBar value={search} onChange={setSearch} />
    </>
  );
}
