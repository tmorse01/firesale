import { Link } from "react-router-dom";

type ViewToggleButtonProps = {
  label: string;
  to: string;
  variant: "feed" | "map";
};

export function ViewToggleButton({ label, to, variant }: ViewToggleButtonProps) {
  return (
    <Link aria-label={label} className="button button-secondary section-action view-toggle" to={to}>
      <span aria-hidden="true" className="view-toggle-icon">
        {variant === "map" ? (
          <svg viewBox="0 0 24 24">
            <path d="M9 18 4 20V6l5-2 6 2 5-2v14l-5 2-6-2Z" />
            <path d="M9 4v14" />
            <path d="M15 6v14" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24">
            <path d="M8 6h12" />
            <path d="M8 12h12" />
            <path d="M8 18h12" />
            <path d="M4 6h.01" />
            <path d="M4 12h.01" />
            <path d="M4 18h.01" />
          </svg>
        )}
      </span>
      <span className="view-toggle-label">{label}</span>
    </Link>
  );
}
