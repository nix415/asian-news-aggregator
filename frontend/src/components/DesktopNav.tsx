import { useNavigate, useLocation } from "react-router-dom";

const LINKS = [
  { path: "/", label: "Home" },
  { path: "/top-picks", label: "Top Picks" },
  { path: "/saved", label: "Saved" },
];

export default function DesktopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="hidden sm:block fixed top-0 left-0 right-0 z-[100] header-blur backdrop-blur-[14px] border-b border-line"
      aria-label="Main navigation"
    >
      <div className="max-w-[1520px] mx-auto px-6 h-12 flex items-center justify-center gap-1 relative">
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
    </nav>
  );
}
