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
  const headerClass = [
    "sticky top-0 z-50 header-blur backdrop-blur-[14px] border-b border-line",
    "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
    visible && !hidden
      ? "translate-y-0 opacity-100 pointer-events-auto"
      : "-translate-y-full opacity-0 pointer-events-none",
  ].join(" ");

  return (
    <header className={headerClass}>
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
