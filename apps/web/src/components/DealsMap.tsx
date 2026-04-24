import { AdvancedMarker, InfoWindow, Map, Pin } from "@vis.gl/react-google-maps";
import type { DealFeedItem } from "../lib/types";
import { googleMapId, googleMapsApiKey } from "../lib/config";

export function DealsMap(props: {
  deals: DealFeedItem[];
  location: { lat: number; lng: number };
  selectedDealId?: string;
  onSelectDeal: (dealId: string) => void;
}) {
  if (!googleMapsApiKey) {
    return (
      <div className="map-fallback">
        <h3>Google Maps key needed</h3>
        <p>Add `VITE_GOOGLE_MAPS_API_KEY` to render the live map experience.</p>
      </div>
    );
  }

  const selected = props.deals.find((deal) => deal.id === props.selectedDealId) ?? null;

  return (
    <Map
      center={props.location}
      defaultZoom={11}
      gestureHandling="greedy"
      mapId={googleMapId || undefined}
      style={{ width: "100%", height: "100%" }}
    >
      {props.deals.map((deal) => (
        <AdvancedMarker
          key={deal.id}
          position={{ lat: deal.location.lat, lng: deal.location.lng }}
          onClick={() => props.onSelectDeal(deal.id)}
        >
          <Pin
            background={deal.status === "expiringSoon" ? "#ef5b28" : "#1a936f"}
            borderColor="#16110d"
            glyphColor="#fff8ef"
          />
        </AdvancedMarker>
      ))}

      {selected ? (
        <InfoWindow
          position={{ lat: selected.location.lat, lng: selected.location.lng }}
          onCloseClick={() => props.onSelectDeal("")}
        >
          <div className="map-info-window">
            <strong>{selected.title}</strong>
            <span>{selected.storeName}</span>
            <span>{selected.timeRemainingLabel}</span>
          </div>
        </InfoWindow>
      ) : null}
    </Map>
  );
}
