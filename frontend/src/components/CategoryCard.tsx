import { useNavigate } from "react-router-dom";
import type { Article, CategoryName } from "../types";
import { CATEGORY_META } from "../lib/constants";

interface Props {
  category: CategoryName;
  articles: Article[];
  loading: boolean;
  index: number;
}

export default function CategoryCard({
  category,
  articles,
  loading,
  index,
}: Props) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[category];
  const imageArticle = articles.find((a) => a.image);

  return (
    <div
      className={`group relative cursor-pointer bg-surface border border-line rounded-[14px] overflow-hidden aspect-[3/4]
        shadow-[0_2px_4px_rgba(0,0,0,0.03),0_8px_20px_rgba(0,0,0,0.04),0_20px_48px_rgba(0,0,0,0.04)]
        transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-2 hover:scale-[1.015]
        hover:shadow-[0_4px_8px_rgba(0,0,0,0.05),0_16px_40px_rgba(0,0,0,0.08),0_32px_64px_rgba(0,0,0,0.07)]
        active:-translate-y-0.5 active:scale-[0.99] active:duration-100
        animate-card-in ${loading ? "animate-shimmer" : ""}`}
      style={{ animationDelay: `${0.15 + index * 0.07}s` }}
      onClick={() => navigate(`/category/${encodeURIComponent(category)}`)}
    >
      {/* Accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] z-[2]"
        style={{ background: meta.color }}
      />

      {/* Background image */}
      {imageArticle?.image && !loading && (
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-50 transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-60 group-hover:scale-[1.04]"
          src={imageArticle.image}
          alt=""
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 overlay-gradient-b" />

      {/* Text content */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-5 z-[1]">
        <span className="block text-[9px] font-bold tracking-[2px] uppercase text-muted mb-1.5">
          Category
        </span>
        <span className="block font-serif text-[clamp(22px,2.2vw,30px)] leading-[1.1] text-primary mb-2">
          {category}
        </span>
        <span className="block text-[11px] leading-relaxed text-mid mb-2 line-clamp-2">
          {meta.description}
        </span>
        <span className="text-[11px] text-muted transition-colors duration-200 group-hover:text-primary">
          {loading ? "Loading…" : `${articles.length} articles`}
        </span>
      </div>

      {/* Arrow */}
      <div className="absolute bottom-[22px] right-5 flex items-center justify-center w-7 h-7 border border-line bg-white/80 z-[1] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[3px] group-hover:-translate-y-[3px] group-hover:bg-white">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M7 17L17 7M17 7H7M17 7v10" />
        </svg>
      </div>
    </div>
  );
}
