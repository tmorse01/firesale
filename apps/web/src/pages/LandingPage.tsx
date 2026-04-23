import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "../hooks/useLocation";
import { getSessionUser, updateSessionUsername } from "../lib/session";
import { Icon } from "../components/ui/Icon";

export function LandingPage() {
  const navigate = useNavigate();
  const { error, loading, requestBrowserLocation, setManualLocation } = useLocation();
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState(getSessionUser().username);

  async function handleManualSubmit(event: FormEvent) {
    event.preventDefault();
    await setManualLocation(query);
    updateSessionUsername(username);
    navigate("/feed?tab=nearby");
  }

  async function handleUseMyLocation() {
    updateSessionUsername(username);
    requestBrowserLocation();
    window.setTimeout(() => navigate("/feed?tab=nearby"), 200);
  }

  return (
    <section className="hero-page">
      <div className="hero-panel">
        <p className="eyebrow">Real-time deal radar</p>
        <h1 className="hero-title">Know what&apos;s hot nearby before it disappears.</h1>
        <p className="hero-copy">
          FireSale turns neighborhood markdowns into a live feed of short-lived wins. Browse what is active,
          validate what is still real, and post your own finds in seconds.
        </p>

        <div className="hero-form-stack">
          <label className="field-stack">
            <span>Your display name</span>
            <input
              className="input"
              maxLength={40}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Guest Scout"
              value={username}
            />
          </label>

          <div className="hero-actions">
            <button className="button button-primary" onClick={handleUseMyLocation} type="button">
              <Icon name="my_location" />
              {loading ? "Finding you..." : "Use my location"}
            </button>
            <Link className="button button-ghost" to="/feed?tab=hot">
              <Icon filled name="whatshot" />
              Browse live feed
            </Link>
          </div>

          <form className="manual-location-form" onSubmit={handleManualSubmit}>
            <input
              className="input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter a city or ZIP"
              value={query}
            />
            <button className="button button-secondary" disabled={!query.trim() || loading} type="submit">
              <Icon name="place" />
              Set area
            </button>
          </form>

          {error ? <p className="inline-error">{error}</p> : null}
        </div>
      </div>

      <div className="hero-grid">
        <article className="hero-stat-card">
          <div className="hero-stat-title">
            <Icon filled name="whatshot" />
            <strong>Hot</strong>
          </div>
          <span>Ranking blends votes, freshness, and urgency.</span>
        </article>
        <article className="hero-stat-card">
          <div className="hero-stat-title">
            <Icon name="place" />
            <strong>Nearby</strong>
          </div>
          <span>Flip straight into a distance-sorted local map and feed.</span>
        </article>
        <article className="hero-stat-card">
          <div className="hero-stat-title">
            <Icon name="verified" />
            <strong>Verified</strong>
          </div>
          <span>Recent comments push real deals up and stale ones down.</span>
        </article>
      </div>
    </section>
  );
}
