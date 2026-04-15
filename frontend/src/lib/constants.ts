import type { CategoryName, SourceMeta } from "../types";

export const CATEGORIES: CategoryName[] = [
  "Brand & Founder",
  "Culture",
  "Community",
  "Lifestyle & New Openings",
];

export const CATEGORY_META: Record<
  CategoryName,
  { color: string; description: string }
> = {
  "Brand & Founder": {
    color: "#8BBFB3",
    description:
      "Stories behind Asian-owned businesses — beauty, fashion & home goods.",
  },
  Culture: {
    color: "#C4655C",
    description:
      "Art, music, film, K-pop, and the ideas shaping Asian identity.",
  },
  Community: {
    color: "#9A6478",
    description:
      "AAPI voices, activism, representation, and regional news from Asia.",
  },
  "Lifestyle & New Openings": {
    color: "#B5A898",
    description:
      "Restaurants, pop-ups, wellness, travel, and the latest new spots.",
  },
};

export const SOURCES: string[] = [
  "NBC Asian America",
  "South China Morning Post",
  "Nikkei Asia",
  "The SF Standard",
  "Channel News Asia",
  "NextShark",
  "AsAmNews",
  "The Korea Herald",
  "Character Media",
  "The Japan Times",
  "Rappler",
  "Eater",
  "Hypebeast",
  "Allkpop",
  "Soompi",
];

export const SOURCE_META: Record<string, SourceMeta> = {
  "NBC Asian America": {
    url: "https://www.nbcnews.com/favicon.ico",
    name: "NBC Asian America",
    cls: "bg-[#0057a8]",
  },
  "South China Morning Post": {
    url: "https://www.scmp.com/favicon.ico",
    name: "South China Morning Post",
    cls: "bg-[#c8102e]",
  },
  "Nikkei Asia": {
    url: "https://asia.nikkei.com/favicon.ico",
    name: "Nikkei Asia",
    cls: "bg-[#e60012]",
  },
  "The SF Standard": {
    url: "https://sfstandard.com/favicon.ico",
    name: "The SF Standard",
    cls: "bg-[#6633cc]",
  },
  "Channel News Asia": {
    url: "https://www.channelnewsasia.com/favicon.ico",
    name: "Channel News Asia",
    cls: "bg-[#e4002b]",
  },
  NextShark: {
    url: "https://nextshark.com/favicon.ico",
    name: "NextShark",
    cls: "bg-[#e91e63]",
  },
  AsAmNews: {
    url: "https://asamnews.com/favicon.ico",
    name: "AsAmNews",
    cls: "bg-[#009688]",
  },
  "The Korea Herald": {
    url: "https://www.koreaherald.com/favicon.ico",
    name: "The Korea Herald",
    cls: "bg-[#c0392b]",
  },
  "Character Media": {
    url: "https://charactermedia.com/favicon.ico",
    name: "Character Media",
    cls: "bg-[#5c6bc0]",
  },
  "The Japan Times": {
    url: "https://www.japantimes.co.jp/favicon.ico",
    name: "The Japan Times",
    cls: "bg-[#b71c1c]",
  },
  Rappler: {
    url: "https://www.rappler.com/favicon.ico",
    name: "Rappler",
    cls: "bg-[#2196f3]",
  },
  Eater: {
    url: "https://www.eater.com/favicon.ico",
    name: "Eater",
    cls: "bg-[#e53935]",
  },
  Hypebeast: {
    url: "https://hypebeast.com/favicon.ico",
    name: "Hypebeast",
    cls: "bg-[#212121]",
  },
  Allkpop: {
    url: "https://www.allkpop.com/favicon.ico",
    name: "Allkpop",
    cls: "bg-[#ff5722]",
  },
  Soompi: {
    url: "https://www.soompi.com/favicon.ico",
    name: "Soompi",
    cls: "bg-[#7b1fa2]",
  },
};

export const TIME_RANGES = [
  { value: "all", label: "All Time" },
  { value: "24h", label: "Past 24 Hours" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
] as const;

export const SORT_OPTIONS = [
  { value: "trending", label: "↑ Newest & Hot" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
] as const;
