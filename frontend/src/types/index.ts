export interface Article {
  title: string;
  summary: string;
  link: string;
  source: string;
  published: string;
  image: string | null;
  trending_score: number;
  social_boost: boolean;
  category: string;
  popularity_score: number;
}

export interface SourceMeta {
  url: string;
  name: string;
  cls: string;
}

export type CategoryName =
  | "Brand & Founder"
  | "Culture"
  | "Community"
  | "Lifestyle & New Openings";

export type SortOption = "popular" | "trending" | "newest" | "oldest";
export type TimeRange = "all" | "24h" | "week" | "month";
