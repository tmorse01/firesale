import { APIProvider } from "@vis.gl/react-google-maps";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppChrome } from "../components/AppChrome";
import { MobileInstallPrompt } from "../components/MobileInstallPrompt";
import { LocationProvider } from "../hooks/useLocation";
import { googleMapsApiKey } from "../lib/config";
import { CreateDealPage } from "../pages/CreateDealPage";
import { DealPage } from "../pages/DealPage";
import { FeedPage } from "../pages/FeedPage";
import { LandingPage } from "../pages/LandingPage";
import { MapPage } from "../pages/MapPage";
import { NotFoundPage } from "../pages/NotFoundPage";

function RouterTree() {
  return (
    <BrowserRouter>
      <LocationProvider>
        <>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<AppChrome />}>
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/create" element={<CreateDealPage />} />
              <Route path="/deals/:id" element={<DealPage />} />
            </Route>
            <Route path="/home" element={<Navigate replace to="/feed?tab=nearby" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <MobileInstallPrompt />
        </>
      </LocationProvider>
    </BrowserRouter>
  );
}

export function App() {
  if (!googleMapsApiKey) {
    return <RouterTree />;
  }

  return (
    <APIProvider apiKey={googleMapsApiKey}>
      <RouterTree />
    </APIProvider>
  );
}
