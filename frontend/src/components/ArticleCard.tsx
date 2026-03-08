import { useState } from "react";
import type { Article } from "../types";
import { SOURCE_META } from "../lib/constants";
import { formatDate, getScoreClass, SCORE_COLORS } from "../lib/utils";

interface Props {
  article: Article;
  index: number;
}

export default function ArticleCard({ article, index }: Props) {
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const score = article.popularity_score || 0;
  const scoreClass = getScoreClass(score);
  const meta = SOURCE_META[article.source];

  return (
    <article
      className="bg-surface border border-line transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:-translate-y-[3px] animate-card-in"
      style={{ animationDelay: `${Math.min(index * 0.045, 0.7)}s` }}
    >
      {/* Image */}
      {article.image && !imgError && (
        <div className="w-full overflow-hidden border-b border-line">
          <img
            className="w-full block object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.04]"
            src={article.image}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      <div className="p-4 flex flex-col">
        {/* Meta row */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            {meta && !faviconError ? (
              <img
                className="w-[13px] h-[13px] object-contain rounded-sm shrink-0"
                src={meta.url}
                alt=""
                loading="lazy"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <div
                className={`w-[13px] h-[13px] rounded-sm flex items-center justify-center text-[7px] font-extrabold text-white shrink-0 ${meta?.cls || "bg-gray-400"}`}
              >
                {(article.source || "?")[0]}
              </div>
            )}
            <span className="text-[9px] font-semibold tracking-[0.8px] uppercase text-muted truncate">
              {meta?.name || article.source}
            </span>
          </div>
          <span className="text-[9px] font-medium tracking-[0.5px] uppercase text-muted shrink-0">
            {formatDate(article.published)}
          </span>
        </div>

        {/* Title */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-serif text-[17px] leading-[1.42] text-primary no-underline block mb-2.5 transition-colors duration-150 hover:text-accent"
        >
          {article.title}
        </a>

        {/* Summary */}
        {article.summary && (
          <p className="text-[12.5px] leading-[1.65] text-mid mb-3.5 line-clamp-3">
            {article.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-line mt-auto flex-wrap">
          <span
            className={`flex items-center gap-1 text-[10px] font-semibold ${SCORE_COLORS[scoreClass]}`}
          >
            <ScoreIcon scoreClass={scoreClass} />
            &nbsp;{score}
          </span>

          {article.social_boost && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-[0.6px] uppercase text-mid border border-line px-1.5 py-0.5 bg-surface whitespace-nowrap">
              {score >= 80
                ? "🔥 IG Ready"
                : score >= 65
                  ? "📸 Post-Worthy"
                  : "📈 Shareable"}
            </span>
          )}

          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold tracking-[0.5px] text-mid underline underline-offset-2 decoration-line transition-colors duration-150 hover:text-primary hover:decoration-primary ml-auto"
          >
            View More
          </a>
        </div>
      </div>
    </article>
  );
}

function ScoreIcon({ scoreClass }: { scoreClass: "hot" | "warm" | "cool" }) {
  if (scoreClass === "hot")
    return (
      <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
          clipRule="evenodd"
        />
      </svg>
    );
  if (scoreClass === "warm")
    return (
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
