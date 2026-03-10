import { useNavigate } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: Props) {
  const navigate = useNavigate();

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-[11px] tracking-[0.5px] text-muted mb-2">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-line">/</span>}
          {item.path != null ? (
            <button
              type="button"
              onClick={() => navigate(item.path!)}
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-primary font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
