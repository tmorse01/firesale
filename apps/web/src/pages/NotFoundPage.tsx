import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="page-section">
      <div className="empty-panel">
        <h1>Nothing to see here.</h1>
        <p>This route burned out. Head back to the live feed.</p>
        <Link className="button button-primary" to="/feed?tab=nearby">
          Open FireSale
        </Link>
      </div>
    </section>
  );
}
