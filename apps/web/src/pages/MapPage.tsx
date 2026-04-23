import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { DealFeedItem } from "../lib/types";
import { DealsMap } from "../components/DealsMap";
import { DealCard } from "../components/DealCard";
import { Icon } from "../components/ui/Icon";
import { ViewToggleButton } from "../components/ViewToggleButton";
import { useLocation } from "../hooks/useLocation";
import { listDeals } from "../lib/api";

export function MapPage() {
  const { location } = useLocation();
  const [items, setItems] = useState<DealFeedItem[]>([]);
  const [selectedDealId, setSelectedDealId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDeals({
      sort: "nearby",
      lat: location?.lat,
      lng: location?.lng
    })
      .then((response) => {
        setItems(response.items);
        setSelectedDealId(response.items[0]?.id || "");
      })
      .catch((reason: Error) => setError(reason.message));
  }, [location?.lat, location?.lng]);

  const selected = items.find((deal) => deal.id === selectedDealId);

  return (
    <section className="page-section map-page">
      <div className="section-headline">
        <div className="section-heading-copy">
          <p className="eyebrow">Map view</p>
          <h1 className="page-title">See what is moving around you</h1>
        </div>
        <ViewToggleButton label="Feed" to="/feed?tab=nearby" variant="feed" />
      </div>

      {!location ? (
        <div className="empty-panel">
          <p className="empty-panel-copy">
            <Icon name="place" />
            Set your location on the <Link to="/">home screen</Link> to unlock the nearby map.
          </p>
        </div>
      ) : (
        <>
          <div className="map-shell">
            <DealsMap deals={items} location={location} onSelectDeal={setSelectedDealId} selectedDealId={selectedDealId} />
          </div>

          {selected ? (
            <div className="map-preview">
              <DealCard deal={selected} />
            </div>
          ) : null}
        </>
      )}

      {error ? <div className="inline-error">{error}</div> : null}
    </section>
  );
}
