interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[300] w-[min(460px,calc(100vw-40px))]">
      <div className="relative bg-white/45 backdrop-blur-[18px] border border-[rgba(228,224,219,0.6)] rounded-full flex items-center shadow-[0_4px_24px_rgba(0,0,0,0.07)] transition-all duration-200 focus-within:shadow-[0_6px_32px_rgba(0,0,0,0.12)] focus-within:bg-white/65 focus-within:border-[rgba(180,175,170,0.7)]">
        <svg
          className="absolute left-3.5 text-muted pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search articles…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-none outline-none py-3.5 pl-[42px] pr-4.5 text-[13px] text-primary placeholder:text-muted"
        />
      </div>
    </div>
  );
}
