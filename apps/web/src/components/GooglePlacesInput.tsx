import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { TextInput } from "./ui/TextInput";

export type PlaceSelection = {
  address: string;
  lat: number;
  lng: number;
  name?: string;
};

export function GooglePlacesInput(props: {
  disabled?: boolean;
  id?: string;
  onChange?: (value: string) => void;
  onSelect: (selection: PlaceSelection) => void;
  placeholder?: string;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onSelectRef = useRef(props.onSelect);
  const places = useMapsLibrary("places");

  useEffect(() => {
    onSelectRef.current = props.onSelect;
  }, [props.onSelect]);

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

      onSelectRef.current({
        address: place.formatted_address,
        lat: geometry.lat(),
        lng: geometry.lng(),
        name: place.name
      });
    });

    return () => {
      listener.remove();
    };
  }, [places]);

  return (
    <TextInput
      ref={inputRef}
      disabled={props.disabled}
      id={props.id}
      onChange={(event) => props.onChange?.(event.target.value)}
      placeholder={props.placeholder || "Search by business or address"}
      type="text"
      value={props.value}
    />
  );
}
