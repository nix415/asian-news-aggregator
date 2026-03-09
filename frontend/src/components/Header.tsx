import { useNavigate } from "react-router-dom";
import { SOURCES, TIME_RANGES, SORT_OPTIONS } from "../lib/constants";
import type { SortOption, TimeRange } from "../types";

interface Props {
  visible: boolean;
  hidden: boolean;
  source: string;
  onSourceChange: (source: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  archiveMode: boolean;
  onToggleArchive: () => void;
  dark: boolean;
  onToggleDark: () => void;
}

export default function Header({
  visible,
  hidden,
  source,
  onSourceChange,
  timeRange,
  onTimeRangeChange,
  sort,
  onSortChange,
  archiveMode,
  onToggleArchive,
  dark,
  onToggleDark,
}: Props) {
  const navigate = useNavigate();

  const headerClass = [
    "sticky top-0 z-50 header-blur backdrop-blur-[14px] border-b border-line",
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
          className="font-display text-[26px] tracking-[0.5px] text-primary flex items-baseline cursor-pointer transition-opacity duration-200 hover:opacity-75"
          onClick={() => navigate("/")}
        >
          Asian
          <span className="gradient-text text-[9px] font-sans font-medium tracking-[2px] uppercase mx-1.5 relative -top-0.5">
            news
          </span>
          Founded
        </div>
        <div className="flex justify-end items-center gap-2.5">
          <button
            onClick={onToggleDark}
            className="flex items-center justify-center w-[34px] h-[34px] bg-surface border border-line text-mid cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary active:scale-[0.95]"
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
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
