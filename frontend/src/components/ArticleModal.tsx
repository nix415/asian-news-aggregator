import { useEffect } from "react";
import type { Article } from "../types";
import { SOURCE_META } from "../lib/constants";
import { formatDate, getScoreClass, SCORE_COLORS } from "../lib/utils";
import { useToast } from "./Toast";

interface Props {
  article: Article;
  bookmarked: boolean;
  onToggleBookmark: (link: string) => void;
  onClose: () => void;
}

export default function ArticleModal({
  article,
  bookmarked,
  onToggleBookmark,
  onClose,
}: Props) {
  const score = article.popularity_score || 0;
  const scoreClass = getScoreClass(score);
  const meta = SOURCE_META[article.source];
  const { showToast } = useToast();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${article.title}\n${article.link}`);
      showToast("Copied to clipboard");
    } catch {
      showToast("Failed to copy");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-[6px] animate-card-in" />

      {/* Modal */}
      <div
        className="relative bg-surface max-w-[640px] w-full max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.25)] animate-card-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-surface/90 border border-line rounded-full cursor-pointer transition-all duration-150 hover:bg-line/50"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        {article.image && (
          <img
            className="w-full max-h-[300px] object-cover border-b border-line"
            src={article.image}
            alt=""
          />
        )}

        <div className="p-6 max-sm:p-4">
          {/* Source + date */}
          <div className="flex items-center gap-2 mb-3">
            {meta ? (
              <img
                className="w-4 h-4 object-contain rounded-sm"
                src={meta.url}
                alt=""
              />
            ) : (
              <div className="w-4 h-4 rounded-sm bg-gray-400 flex items-center justify-center text-[8px] font-bold text-white">
                {(article.source || "?")[0]}
              </div>
            )}
            <span className="text-[11px] font-semibold tracking-[0.5px] uppercase text-muted">
              {meta?.name || article.source}
            </span>
            <span className="text-[11px] text-muted ml-auto">
              {formatDate(article.published)}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-serif text-[22px] leading-[1.35] text-primary mb-3">
            {article.title}
          </h2>

          {/* Summary */}
          {article.summary && (
            <p className="text-[13px] leading-[1.7] text-mid mb-5">
              {article.summary}
            </p>
          )}

          {/* Score bar */}
          <div className="flex items-center gap-3 py-3 border-t border-b border-line mb-5">
            <span
              className={`flex items-center gap-1.5 text-[12px] font-semibold ${SCORE_COLORS[scoreClass]}`}
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                  clipRule="evenodd"
                />
              </svg>
              {score} / 100
            </span>
            {article.social_boost && (
              <span className="text-[10px] font-semibold tracking-[0.5px] uppercase text-mid border border-line px-2 py-0.5">
                {score >= 80
                  ? "🔥 IG Ready"
                  : score >= 65
                    ? "📸 Post-Worthy"
                    : "📈 Shareable"}
              </span>
            )}
            <span className="text-[10px] text-muted ml-auto">
              {article.category}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-surface border-none px-5 py-2.5 text-[11px] font-semibold tracking-[0.8px] uppercase no-underline transition-all duration-150 hover:bg-primary/90 active:scale-[0.97]"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              Read Article
            </a>

            <button
              onClick={() => onToggleBookmark(article.link)}
              className={`flex items-center gap-2 border px-5 py-2.5 text-[11px] font-semibold tracking-[0.8px] uppercase cursor-pointer transition-all duration-150 active:scale-[0.97] ${
                bookmarked
                  ? "bg-primary text-surface border-primary"
                  : "bg-surface text-mid border-line hover:border-primary hover:text-primary"
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={bookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              {bookmarked ? "Saved" : "Save"}
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-surface text-mid border border-line px-5 py-2.5 text-[11px] font-semibold tracking-[0.8px] uppercase cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary active:scale-[0.97]"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
