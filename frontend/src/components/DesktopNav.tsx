import { useNavigate, useLocation } from "react-router-dom";

interface Props {
  dark: boolean;
  onToggleDark: () => void;
}

const LINKS = [
  { path: "/", label: "Home" },
  { path: "/top-picks", label: "Top Picks" },
  { path: "/saved", label: "Saved" },
];

export default function DesktopNav({ dark, onToggleDark }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="hidden sm:block fixed top-0 left-0 right-0 z-[100] header-blur backdrop-blur-[14px] border-b border-line"
      aria-label="Main navigation"
    >
      <div className="max-w-[1520px] mx-auto px-6 h-12 flex items-center justify-between gap-6">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          className="font-display text-[20px] tracking-[0.5px] text-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm transition-opacity"
        >
          Asian<span className="gradient-text text-[8px] font-sans font-medium tracking-[2px] uppercase mx-1 relative -top-0.5">news</span>Founded
        </a>

        <div className="flex items-center gap-1">
          {LINKS.map(({ path, label }) => {
            const isActive = path === "/" ? location.pathname === "/" : location.pathname === path;
            const activeClass = isActive
              ? "text-primary font-semibold"
              : "text-muted hover:text-primary";
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`px-4 py-2 text-[12px] tracking-[0.5px] uppercase bg-transparent border-none cursor-pointer transition-colors duration-150 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${activeClass}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onToggleDark}
          className="flex items-center justify-center w-8 h-8 rounded-sm bg-surface border border-line text-mid hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
