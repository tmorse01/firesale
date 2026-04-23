import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

type PlaceSelection = {
  address: string;
  lat: number;
  lng: number;
  name?: string;
};

export function GooglePlacesInput(props: {
  defaultValue?: string;
  disabled?: boolean;
  onSelect: (selection: PlaceSelection) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const places = useMapsLibrary("places");

  useEffect(() => {
    if (!places || !inputRef.current) {
      return;
    }

    const autocomplete = new places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
      types: ["establishment", "geocode"]
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const geometry = place.geometry?.location;
      if (!geometry || !place.formatted_address) {
        return;
      }

      props.onSelect({
        address: place.formatted_address,
        lat: geometry.lat(),
        lng: geometry.lng(),
        name: place.name
      });
    });

    return () => {
      listener.remove();
    };
  }, [places, props]);

  return (
    <input
      ref={inputRef}
      className="input"
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      placeholder={props.placeholder || "Search by business or address"}
      type="text"
    />
  );
}
