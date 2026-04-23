import { Link } from "react-router-dom";
import { Icon } from "./ui/Icon";

type ViewToggleButtonProps = {
  label: string;
  to: string;
  variant: "feed" | "map";
};

export function ViewToggleButton({ label, to, variant }: ViewToggleButtonProps) {
  return (
    <Link aria-label={label} className="button button-secondary section-action view-toggle" to={to}>
      <Icon className="view-toggle-icon" name={variant === "map" ? "map" : "whatshot"} />
      <span className="view-toggle-label">{label}</span>
    </Link>
  );
}
