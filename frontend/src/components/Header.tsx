import { useNavigate } from "react-router-dom";
import { TIME_RANGES, SORT_OPTIONS } from "../lib/constants";
import type { SortOption, TimeRange } from "../types";

interface Props {
  visible: boolean;
  hidden: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function Header({
  visible,
  hidden,
  timeRange,
  onTimeRangeChange,
  sort,
  onSortChange,
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
        <div className="flex flex-col items-center">
          <div
            className="font-display text-[20px] tracking-[0.5px] text-primary flex items-baseline cursor-pointer transition-opacity duration-200 hover:opacity-75"
            onClick={() => navigate("/")}
          >
            Asian
            <span className="gradient-text text-[7px] font-sans font-medium tracking-[2px] uppercase mx-1.5 relative -top-0.5">
              news
            </span>
            Founded
          </div>
          <span className="text-[12px] italic text-muted max-sm:hidden">
            Your roundup of business, news, &amp; the new.
          </span>
        </div>
        <div className="flex-1" />
      </div>

      {/* Filter row */}
      <div className="max-w-[1520px] mx-auto px-10 py-3.5 flex items-center gap-2 flex-wrap border-b border-line max-sm:px-4">
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
      </div>
    </header>
  );
}
