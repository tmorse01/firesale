import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useLocation as useAppLocation } from "../hooks/useLocation";
import { Icon } from "./ui/Icon";
import { TextInput } from "./ui/TextInput";

export function AppChrome() {
  const { error, loading, location, requestBrowserLocation, setManualLocation } = useAppLocation();
  const [areaQuery, setAreaQuery] = useState("");
  const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);
  const [isResolvingBrowserLocation, setIsResolvingBrowserLocation] = useState(false);

  useEffect(() => {
    if (!isAreaPickerOpen) {
      return;
    }

    setAreaQuery(location?.label === "Current location" ? "" : location?.label || "");
  }, [isAreaPickerOpen, location?.label]);

  useEffect(() => {
    if (!isResolvingBrowserLocation || loading) {
      return;
    }

    setIsResolvingBrowserLocation(false);

    if (!error && location) {
      setIsAreaPickerOpen(false);
    }
  }, [error, isResolvingBrowserLocation, loading, location]);

  async function handleAreaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = areaQuery.trim();
    if (!trimmed) {
      return;
    }

    await setManualLocation(trimmed);
    setIsAreaPickerOpen(false);
  }

  function handleUseMyLocation() {
    setIsResolvingBrowserLocation(true);
    requestBrowserLocation();
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-wrap">
          <Link className="brand" to="/">
            <span className="brand-mark">
              <Icon className="brand-icon" filled name="whatshot" />
              FireSale
            </span>
            <span className="brand-subtitle">Live local deals</span>
          </Link>
        </div>

        <div className="header-chip-wrap">
          <button
            aria-expanded={isAreaPickerOpen}
            aria-haspopup="dialog"
            className={isAreaPickerOpen ? "header-chip header-chip-button is-open" : "header-chip header-chip-button"}
            onClick={() => setIsAreaPickerOpen((current) => !current)}
            type="button"
          >
            <Icon className="header-chip-icon" name="place" />
            <span className="header-chip-text">{location?.label || "Set your area"}</span>
            <Icon className="header-chip-caret" name="keyboard_arrow_down" />
          </button>

          {isAreaPickerOpen ? (
            <div aria-label="Switch area" className="area-picker" role="dialog">
              <div className="area-picker-copy">
                <p className="eyebrow">Switch area</p>
                <p className="area-picker-title">Update where nearby deals are centered.</p>
              </div>

              <button className="button button-secondary area-picker-locate" onClick={handleUseMyLocation} type="button">
                <Icon name="my_location" />
                {loading && isResolvingBrowserLocation ? "Finding you..." : "Use my location"}
              </button>

              <form className="area-picker-form" onSubmit={(event) => void handleAreaSubmit(event)}>
                <TextInput
                  onChange={(event) => setAreaQuery(event.target.value)}
                  placeholder="Enter a city or ZIP"
                  value={areaQuery}
                />

                <div className="area-picker-actions">
                  <button className="button button-primary" disabled={!areaQuery.trim() || loading} type="submit">
                    <Icon filled name="place" />
                    {loading && !isResolvingBrowserLocation ? "Updating..." : "Update area"}
                  </button>
                  <button className="button button-secondary" onClick={() => setIsAreaPickerOpen(false)} type="button">
                    Cancel
                  </button>
                </div>
              </form>

              {error ? <div className="inline-error area-picker-error">{error}</div> : null}
            </div>
          ) : null}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/feed?tab=nearby">
          {({ isActive }) => (
            <>
              <Icon className="bottom-nav-icon" filled={isActive} name="whatshot" />
              <span className="bottom-nav-label">Feed</span>
            </>
          )}
        </NavLink>
        <NavLink to="/map">
          {({ isActive }) => (
            <>
              <Icon className="bottom-nav-icon" filled={isActive} name="map" />
              <span className="bottom-nav-label">Map</span>
            </>
          )}
        </NavLink>
        <NavLink to="/create">
          {({ isActive }) => (
            <>
              <Icon className="bottom-nav-icon" filled={isActive} name="add_circle" />
              <span className="bottom-nav-label">Post</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
