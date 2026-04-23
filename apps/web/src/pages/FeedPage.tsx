import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { DealFeedItem } from "../lib/types";
import { listDeals } from "../lib/api";
import { useLocation } from "../hooks/useLocation";
import { DealCard } from "../components/DealCard";
import { ViewToggleButton } from "../components/ViewToggleButton";

const allowedTabs = new Set(["nearby", "hot", "new"]);

export function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const currentTab = allowedTabs.has(initialTab || "") ? (initialTab as "nearby" | "hot" | "new") : "nearby";
  const [items, setItems] = useState<DealFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { location } = useLocation();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listDeals({
      sort: currentTab,
      lat: location?.lat,
      lng: location?.lng
    })
      .then((response) => {
        if (!active) return;
        setItems(response.items);
        setNextCursor(response.nextCursor);
      })
      .catch((reason: Error) => {
        if (!active) return;
        setError(reason.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentTab, location?.lat, location?.lng]);

  async function loadMore() {
    if (!nextCursor) {
      return;
    }

    const response = await listDeals({
      cursor: nextCursor,
      sort: currentTab,
      lat: location?.lat,
      lng: location?.lng
    });
    setItems((previous) => [...previous, ...response.items]);
    setNextCursor(response.nextCursor);
  }

  return (
    <section className="page-section">
      <div className="section-headline">
        <div className="section-heading-copy">
          <p className="eyebrow">Live feed</p>
          <h1 className="page-title">
            {currentTab === "nearby" ? "Deals close to you" : currentTab === "hot" ? "Trending deals" : "Newest finds"}
          </h1>
        </div>
        <ViewToggleButton label="Map" to="/map" variant="map" />
      </div>

      <div className="tabs">
        {(["nearby", "hot", "new"] as const).map((tab) => (
          <button
            key={tab}
            className={tab === currentTab ? "tab is-active" : "tab"}
            onClick={() => setSearchParams({ tab })}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {currentTab === "nearby" && !location ? (
        <div className="callout">
          <strong>Add your area for better nearby results.</strong>
          <Link to="/">Set location</Link>
        </div>
      ) : null}

      {error ? <div className="inline-error">{error}</div> : null}
      {loading ? <div className="loading-panel">Loading active deals...</div> : null}

      <div className="deal-grid">
        {items.map((deal) => (
          <DealCard deal={deal} key={deal.id} />
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <div className="empty-panel">No active deals yet. Be the first to post one in your area.</div>
      ) : null}

      {nextCursor ? (
        <button className="button button-secondary center-button" onClick={() => void loadMore()} type="button">
          Load more
        </button>
      ) : null}
    </section>
  );
}
