import type { Article, CategoryName } from "../types";
import { CATEGORIES } from "../lib/constants";
import CategoryCard from "../components/CategoryCard";

interface Props {
  articles: Article[];
  loading: boolean;
}

export default function Landing({ articles, loading }: Props) {
  const buckets = groupByCategory(articles);

  return (
    <div className="min-h-screen flex flex-col items-center pt-[18vh] pb-[6vh] px-8">
      <h1 className="font-[system-ui,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Helvetica_Neue',sans-serif] text-[clamp(52px,8vw,110px)] font-bold tracking-[0.08em] leading-[0.95] text-center text-primary animate-hero-in select-none uppercase mb-2">
        ASIAN{" "}
        <span className="gradient-text font-sans text-[clamp(10px,1.4vw,16px)] font-medium tracking-[3px] uppercase mx-1.5 relative -top-[0.15em]">
          news
        </span>{" "}
        FOUNDED
      </h1>

      <p className="font-sans text-[clamp(11px,1.5vw,14px)] italic text-muted text-center tracking-[0.3px] animate-hero-in-delay mb-[clamp(40px,6vh,72px)]">
        Your roundup of business, news, &amp; the new.
      </p>

      <div className="grid grid-cols-4 gap-5 w-full max-w-[1200px] max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:gap-3">
        {CATEGORIES.map((cat, i) => (
          <CategoryCard
            key={cat}
            category={cat}
            articles={buckets[cat]}
            loading={loading}
            index={i}
          />
        ))}
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
