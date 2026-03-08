import { useNavigate } from "react-router-dom";
import { SOURCES, TIME_RANGES, SORT_OPTIONS } from "../lib/constants";
import type { SortOption, TimeRange } from "../types";

interface Props {
  visible: boolean;
  hidden: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  source: string;
  onSourceChange: (source: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  archiveMode: boolean;
  onToggleArchive: () => void;
}

export default function Header({
  visible,
  hidden,
  refreshing,
  onRefresh,
  source,
  onSourceChange,
  timeRange,
  onTimeRangeChange,
  sort,
  onSortChange,
  archiveMode,
  onToggleArchive,
}: Props) {
  const navigate = useNavigate();

  const headerClass = [
    "sticky top-0 z-50 bg-[rgba(247,245,242,0.94)] backdrop-blur-[14px] border-b border-line",
    "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
    visible && !hidden
      ? "translate-y-0 opacity-100 pointer-events-auto"
      : "-translate-y-full opacity-0 pointer-events-none",
  ].join(" ");

  return (
    <header className={headerClass}>
      {/* Top bar */}
      <div className="max-w-[1520px] mx-auto px-10 h-[60px] grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-sm:px-4">
        <div className="flex-1" />
        <div
          className="font-display text-[20px] tracking-[0.5px] text-primary flex items-baseline cursor-pointer transition-opacity duration-200 hover:opacity-75"
          onClick={() => navigate("/")}
        >
          Asian
          <span className="gradient-text text-[7px] font-sans font-medium tracking-[2px] uppercase mx-1 relative -top-0.5">
            news
          </span>
          Founded
        </div>
        <div className="flex justify-end items-center gap-2.5">
          <button
            className="flex items-center gap-1.5 bg-primary border border-primary text-surface px-3.5 py-[7px] text-[11px] font-semibold tracking-[0.8px] uppercase cursor-pointer transition-all duration-150 relative overflow-hidden hover:bg-primary/90 active:scale-[0.97]"
            onClick={onRefresh}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={refreshing ? "animate-spin" : ""}
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="max-w-[1520px] mx-auto px-10 py-3.5 flex items-center gap-2 flex-wrap border-b border-line max-sm:px-4">
        <select
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          className="select-arrow bg-surface border border-line text-mid px-3 py-[5px] pr-7 text-[11px] font-medium outline-none cursor-pointer transition-colors duration-150 hover:border-primary min-w-[160px]"
        >
          <option value="all">All Sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          className="select-arrow bg-surface border border-line text-mid px-3 py-[5px] pr-7 text-[11px] font-medium outline-none cursor-pointer transition-colors duration-150 hover:border-primary"
        >
          {TIME_RANGES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="select-arrow ml-auto bg-surface border border-line text-mid px-3 py-[5px] pr-7 text-[11px] outline-none cursor-pointer transition-colors duration-150 hover:border-primary"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          onClick={onToggleArchive}
          className={`flex items-center gap-1.5 border px-3.5 py-[5px] text-[11px] font-semibold tracking-[0.5px] cursor-pointer transition-all duration-150 whitespace-nowrap ${
            archiveMode
              ? "bg-primary text-surface border-primary"
              : "bg-surface text-mid border-line hover:border-primary hover:text-primary"
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
          Archive
        </button>
      </div>

      {/* Archive banner */}
      {archiveMode && (
        <div className="max-w-[1520px] mx-auto px-10 py-2 text-[11px] text-muted tracking-[0.3px] border-b border-line flex items-center gap-2 max-sm:px-4">
          <div className="w-1.5 h-1.5 bg-[#9A6478] rounded-full shrink-0" />
          <strong className="text-primary font-semibold">Archive Mode</strong> —
          showing all saved articles from the database, sorted by popularity.
        </div>
      )}
    </header>
  );
}
