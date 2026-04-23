import { useState } from "react";
import { AdvancedMarker, Map, Pin } from "@vis.gl/react-google-maps";
import { googleMapId } from "../lib/config";
import { reverseGeocodeLocation } from "../lib/geocoding";

type PickedLocation = {
  address: string;
  lat: number;
  lng: number;
};

type LatLngPoint = {
  lat: number;
  lng: number;
};

function formatCoordinates(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function toLiteral(
  value: LatLngPoint | { toJSON: () => LatLngPoint } | null | undefined
): LatLngPoint | null {
  if (!value) {
    return null;
  }

  return "toJSON" in value ? value.toJSON() : value;
}

export function LocationPickerMap(props: {
  disabled?: boolean;
  location: PickedLocation;
  onError?: (message: string | null) => void;
  onPick: (selection: PickedLocation) => void;
}) {
  const [resolving, setResolving] = useState(false);

  async function updateLocation(point: LatLngPoint) {
    if (props.disabled) {
      return;
    }

    setResolving(true);
    props.onError?.(null);

    try {
      const selection = await reverseGeocodeLocation(point.lat, point.lng);
      props.onPick(selection);
    } catch {
      props.onPick({
        address: formatCoordinates(point.lat, point.lng),
        lat: point.lat,
        lng: point.lng
      });
      props.onError?.("We saved the pin, but couldn't read back the street address yet.");
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="location-picker">
      <div className="location-picker-map">
        <Map
          center={{ lat: props.location.lat, lng: props.location.lng }}
          defaultZoom={14}
          gestureHandling="greedy"
          mapId={googleMapId || undefined}
          onClick={(event) => {
            const point = event.detail.latLng;
            if (!point) {
              return;
            }

            void updateLocation(point);
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <AdvancedMarker
            draggable={!props.disabled}
            position={{ lat: props.location.lat, lng: props.location.lng }}
            title={props.location.address}
            onDragEnd={(event) => {
              const point = toLiteral(event.latLng);
              if (!point) {
                return;
              }

              void updateLocation(point);
            }}
          >
            <Pin background="#f05a28" borderColor="#16110d" glyphColor="#fff8ef" />
          </AdvancedMarker>
        </Map>
      </div>

      <div className="location-picker-meta">
        <p className="location-picker-hint">Search above or tap the map to drop a pin. You can drag the pin too.</p>
        <span className="location-chip">{formatCoordinates(props.location.lat, props.location.lng)}</span>
        {resolving ? <span className="location-picker-status">Looking up the address for that pin...</span> : null}
      </div>
    </div>
  );
}
