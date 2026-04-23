import { googleMapsApiKey } from "./config";

type GeocodingResult = {
  address: string;
  lat: number;
  lng: number;
};

type GeocodingResponse = {
  results?: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status?: string;
};

async function geocodeRequest(url: string, fallbackMessage: string): Promise<GeocodingResult> {
  if (!googleMapsApiKey) {
    throw new Error("Google Maps is not configured");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  const payload = (await response.json()) as GeocodingResponse;
  const result = payload.results?.[0];

  if (!result) {
    throw new Error(payload.status || fallbackMessage);
  }

  return {
    address: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng
  };
}

export function geocodeAddress(address: string) {
  const query = encodeURIComponent(address.trim());
  return geocodeRequest(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${googleMapsApiKey}`,
    "We couldn't find that address."
  );
}

export function reverseGeocodeLocation(lat: number, lng: number) {
  return geocodeRequest(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`,
    "We couldn't read that map pin."
  );
}
