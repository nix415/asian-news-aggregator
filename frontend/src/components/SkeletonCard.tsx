export default function SkeletonCard({ index }: { index: number }) {
  const hasImage = index % 3 !== 2;

  return (
    <div
      className="bg-surface border border-line animate-card-in overflow-hidden"
      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
    >
      {hasImage && (
        <div className="w-full h-[160px] bg-line/60 skeleton-shimmer" />
      )}
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-[13px] h-[13px] rounded-sm bg-line/60 skeleton-shimmer" />
          <div className="h-[8px] w-[80px] bg-line/60 rounded skeleton-shimmer" />
          <div className="ml-auto h-[8px] w-[40px] bg-line/60 rounded skeleton-shimmer" />
        </div>
        <div className="h-[16px] w-full bg-line/60 rounded skeleton-shimmer" />
        <div className="h-[16px] w-[75%] bg-line/60 rounded skeleton-shimmer" />
        <div className="h-[10px] w-full bg-line/40 rounded skeleton-shimmer" />
        <div className="h-[10px] w-[90%] bg-line/40 rounded skeleton-shimmer" />
        <div className="h-[10px] w-[60%] bg-line/40 rounded skeleton-shimmer" />
        <div className="flex items-center justify-between pt-2.5 border-t border-line mt-1">
          <div className="h-[10px] w-[30px] bg-line/60 rounded skeleton-shimmer" />
          <div className="h-[10px] w-[60px] bg-line/60 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="masonry-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} index={i} />
      ))}
    </div>
  );
}
