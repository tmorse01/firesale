import { Link } from "react-router-dom";
import { Icon } from "../components/ui/Icon";

export function NotFoundPage() {
  return (
    <section className="page-section">
      <div className="empty-panel">
        <h1>Nothing to see here.</h1>
        <p>This route burned out. Head back to the live feed.</p>
        <Link className="button button-primary" to="/feed?tab=nearby">
          <Icon filled name="home" />
          Open FireSale
        </Link>
      </div>
    </section>
  );
}
