export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);

    if (isNaN(diffMin)) return "";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;

    const days = Math.floor(diffMin / 1440);
    if (days < 2) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 14) return "1 week ago";
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function getScoreClass(score: number): "hot" | "warm" | "cool" {
  if (score >= 70) return "hot";
  if (score >= 45) return "warm";
  return "cool";
}

export const SCORE_COLORS = {
  hot: "text-[#c4655c]",
  warm: "text-[#c4a042]",
  cool: "text-[#9e9890]",
} as const;

export const TIME_CUTOFFS: Record<string, number> = {
  "24h": 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
};
