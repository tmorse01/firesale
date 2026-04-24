import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminDeals, moderateDeal } from "../lib/api";
import { clearAdminKey, getAdminKey, setAdminKey } from "../lib/session";
import type { AdminDealsResponse, AdminModerationAction, DealFeedItem } from "../lib/types";
import { StatusBadge } from "../components/StatusBadge";
import { Icon } from "../components/ui/Icon";
import { TextInput } from "../components/ui/TextInput";

type VisibilityFilter = "all" | "visible" | "hidden" | "deleted";
type SourceFilter = "all" | "manual" | "automated";

function formatTimestamp(value?: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function AdminPostsPage() {
  const [items, setItems] = useState<DealFeedItem[]>([]);
  const [stats, setStats] = useState<AdminDealsResponse["stats"] | null>(null);
  const [adminKeyInput, setAdminKeyInput] = useState(getAdminKey());
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [activeDealId, setActiveDealId] = useState<string | null>(null);

  async function hydrate() {
    const response = await listAdminDeals();
    setItems(response.items);
    setStats(response.stats);
  }

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    hydrate()
      .catch((reason) => {
        if (!mounted) {
          return;
        }

        setError(getErrorMessage(reason));
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((deal) => {
      if (visibilityFilter === "visible" && (deal.hiddenAt || deal.deletedAt)) {
        return false;
      }

      if (visibilityFilter === "hidden" && (!deal.hiddenAt || deal.deletedAt)) {
        return false;
      }

      if (visibilityFilter === "deleted" && !deal.deletedAt) {
        return false;
      }

      if (sourceFilter === "manual" && deal.isAutomated) {
        return false;
      }

      if (sourceFilter === "automated" && !deal.isAutomated) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        deal.title,
        deal.storeName,
        deal.description,
        deal.location.address,
        deal.sourceName || "",
        deal.sourceKey || ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [items, query, visibilityFilter, sourceFilter]);

  async function handleAuthorize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthorizing(true);
    setActionError(null);
    setAdminKey(adminKeyInput);

    try {
      await hydrate();
      setError(null);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setAuthorizing(false);
    }
  }

  async function handleModeration(dealId: string, action: AdminModerationAction) {
    setActiveDealId(dealId);
    setActionError(null);

    try {
      const response = await moderateDeal(dealId, action);
      setItems((current) => current.map((deal) => (deal.id === dealId ? response.deal : deal)));
      await hydrate();
    } catch (reason) {
      setActionError(getErrorMessage(reason));
    } finally {
      setActiveDealId(null);
    }
  }

  function handleSignOut() {
    clearAdminKey();
    setAdminKeyInput("");
    setError("Admin key cleared. Enter it again if this environment requires one.");
  }

  const needsAuthorization = error === "Admin authorization required.";

  return (
    <section className="page-section admin-page">
      <div className="admin-hero">
        <div className="section-headline">
          <div className="section-heading-copy">
            <p className="eyebrow">Moderation</p>
            <h1 className="page-title">Manage posts</h1>
            <p className="hero-copy">Hide noisy posts, soft-delete bad imports, and expire stale deals without touching the public feed by hand.</p>
          </div>
          <Link className="button button-secondary section-action" to="/feed?tab=nearby">
            <Icon name="whatshot" />
            Back to feed
          </Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar-top">
          <div>
            <strong>Public feed safety</strong>
            <p className="admin-muted">Hidden and deleted posts disappear from public feed and detail pages immediately.</p>
          </div>

          <div className="admin-key-row">
            <span className="admin-post-pill">
              <Icon name="admin_panel_settings" />
              Admin mode
            </span>
            <button className="button button-secondary" onClick={handleSignOut} type="button">
              Clear key
            </button>
          </div>
        </div>

        <div className="admin-toolbar-actions">
          <TextInput onChange={(event) => setQuery(event.target.value)} placeholder="Search title, store, address, or source" value={query} />
          <div className="tabs">
            {(["all", "visible", "hidden", "deleted"] as const).map((value) => (
              <button
                key={value}
                className={visibilityFilter === value ? "tab is-active" : "tab"}
                onClick={() => setVisibilityFilter(value)}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
          <div className="tabs">
            {(["all", "manual", "automated"] as const).map((value) => (
              <button
                key={value}
                className={sourceFilter === value ? "tab is-active" : "tab"}
                onClick={() => setSourceFilter(value)}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {stats ? (
          <div className="admin-stat-grid">
            <article className="admin-stat-card">
              <span>Total</span>
              <strong>{stats.total}</strong>
            </article>
            <article className="admin-stat-card">
              <span>Visible</span>
              <strong>{stats.visible}</strong>
            </article>
            <article className="admin-stat-card">
              <span>Hidden</span>
              <strong>{stats.hidden}</strong>
            </article>
            <article className="admin-stat-card">
              <span>Deleted</span>
              <strong>{stats.deleted}</strong>
            </article>
            <article className="admin-stat-card">
              <span>Automated</span>
              <strong>{stats.automated}</strong>
            </article>
            <article className="admin-stat-card">
              <span>Manual</span>
              <strong>{stats.manual}</strong>
            </article>
          </div>
        ) : null}

        {actionError ? <div className="inline-error">{actionError}</div> : null}
      </div>

      {needsAuthorization ? (
        <form className="admin-auth-card" onSubmit={(event) => void handleAuthorize(event)}>
          <div>
            <p className="eyebrow">Protected</p>
            <h2>Enter admin key</h2>
            <p className="admin-muted">This API requires `FIRESALE_ADMIN_KEY`. Enter it here and the app will keep it in local storage for future moderation requests.</p>
          </div>

          <TextInput
            onChange={(event) => setAdminKeyInput(event.target.value)}
            placeholder="Admin key"
            type="password"
            value={adminKeyInput}
          />

          <div className="admin-key-row">
            <button className="button button-primary" disabled={!adminKeyInput.trim() || authorizing} type="submit">
              <Icon name="admin_panel_settings" />
              {authorizing ? "Checking..." : "Unlock admin"}
            </button>
            <button className="button button-secondary" onClick={handleSignOut} type="button">
              Reset
            </button>
          </div>
        </form>
      ) : null}

      {error && !needsAuthorization ? <div className="inline-error">{error}</div> : null}
      {loading ? <div className="loading-panel">Loading posts...</div> : null}

      {!loading && !needsAuthorization ? (
        filteredItems.length ? (
          <div className="admin-post-list">
            {filteredItems.map((deal) => {
              const isBusy = activeDealId === deal.id;

              return (
                <article className="admin-post-card" key={deal.id}>
                  <div className="admin-post-layout">
                    <div className="admin-post-media">
                      {deal.imageUrl ? <img alt={deal.title} src={deal.imageUrl} /> : <div className="deal-image-fallback" />}
                    </div>

                    <div className="admin-post-body">
                      <div className="admin-post-header">
                        <div className="admin-post-copy">
                          <h2>{deal.title}</h2>
                          <p>{deal.description}</p>
                        </div>

                        <Link className="button button-secondary admin-action-button" to={`/deals/${deal.id}`}>
                          View
                        </Link>
                      </div>

                      <div className="admin-post-meta">
                        <span className="admin-post-pill">
                          <Icon name="storefront" />
                          {deal.storeName}
                        </span>
                        <span className="admin-post-pill">
                          <Icon name="place" />
                          {deal.location.address}
                        </span>
                        <span className="admin-post-pill">
                          <Icon name="schedule" />
                          {formatTimestamp(deal.createdAt)}
                        </span>
                        <StatusBadge status={deal.status} />
                        {deal.isAutomated ? (
                          <span className="admin-post-pill is-automated">
                            <Icon name="restart_alt" />
                            Automated
                          </span>
                        ) : (
                          <span className="admin-post-pill">Manual</span>
                        )}
                        {deal.hiddenAt && !deal.deletedAt ? (
                          <span className="admin-post-pill is-hidden">
                            <Icon name="visibility_off" />
                            Hidden
                          </span>
                        ) : null}
                        {deal.deletedAt ? (
                          <span className="admin-post-pill is-deleted">
                            <Icon name="delete" />
                            Deleted
                          </span>
                        ) : null}
                      </div>

                      {deal.isAutomated ? (
                        <div className="admin-note-row">
                          <Icon name="restart_alt" />
                          Source: {deal.sourceName}
                        </div>
                      ) : null}

                      <div className="admin-post-actions">
                        {!deal.hiddenAt && !deal.deletedAt ? (
                          <button
                            className="button button-warning admin-action-button"
                            disabled={isBusy}
                            onClick={() => void handleModeration(deal.id, "hide")}
                            type="button"
                          >
                            <Icon name="visibility_off" />
                            {isBusy ? "Working..." : "Hide"}
                          </button>
                        ) : null}

                        {deal.hiddenAt && !deal.deletedAt ? (
                          <button
                            className="button button-secondary admin-action-button"
                            disabled={isBusy}
                            onClick={() => void handleModeration(deal.id, "unhide")}
                            type="button"
                          >
                            <Icon name="visibility" />
                            {isBusy ? "Working..." : "Unhide"}
                          </button>
                        ) : null}

                        {!deal.deletedAt ? (
                          <button
                            className="button button-danger admin-action-button"
                            disabled={isBusy}
                            onClick={() => void handleModeration(deal.id, "delete")}
                            type="button"
                          >
                            <Icon name="delete" />
                            {isBusy ? "Working..." : "Delete"}
                          </button>
                        ) : (
                          <button
                            className="button button-secondary admin-action-button"
                            disabled={isBusy}
                            onClick={() => void handleModeration(deal.id, "restore")}
                            type="button"
                          >
                            <Icon name="restart_alt" />
                            {isBusy ? "Working..." : "Restore"}
                          </button>
                        )}

                        {deal.status !== "expired" ? (
                          <button
                            className="button button-ghost admin-action-button"
                            disabled={isBusy}
                            onClick={() => void handleModeration(deal.id, "expire")}
                            type="button"
                          >
                            <Icon name="remove_circle" />
                            {isBusy ? "Working..." : "Expire"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty-state">No posts match the current filters.</div>
        )
      ) : null}
    </section>
  );
}
