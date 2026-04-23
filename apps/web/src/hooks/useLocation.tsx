import { createContext, useContext, useState, type ReactNode } from "react";
import { googleMapsApiKey } from "../lib/config";
import { usePersistentState } from "./usePersistentState";

export type AppLocation = {
  label: string;
  lat: number;
  lng: number;
};

type LocationContextValue = {
  error: string | null;
  loading: boolean;
  location: AppLocation | null;
  requestBrowserLocation: () => void;
  setManualLocation: (query: string) => Promise<void>;
  setLocation: (location: AppLocation) => void;
};

const losAngelesFallback: AppLocation = {
  label: "Los Angeles, CA",
  lat: 34.0522,
  lng: -118.2437
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = usePersistentState<AppLocation | null>("firesale.location", null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestBrowserLocation = () => {
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          label: "Current location",
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      () => {
        setError("We couldn't read your location. You can still enter a city or ZIP.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const setManualLocation = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setLoading(true);
    setError(null);

    if (!googleMapsApiKey) {
      setLocation({ ...losAngelesFallback, label: trimmed });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${googleMapsApiKey}`
      );
      const payload = (await response.json()) as {
        results?: Array<{ formatted_address: string; geometry: { location: { lat: number; lng: number } } }>;
        status?: string;
      };

      const result = payload.results?.[0];
      if (!result) {
        throw new Error(payload.status || "No results");
      }

      setLocation({
        label: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      });
    } catch {
      setError("We couldn't geocode that location. Using Los Angeles demo coverage for now.");
      setLocation({ ...losAngelesFallback, label: trimmed });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocationContext.Provider
      value={{ error, loading, location, requestBrowserLocation, setLocation, setManualLocation }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used inside LocationProvider");
  }

  return context;
}
