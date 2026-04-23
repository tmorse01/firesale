import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DealCategory } from "@firesale/shared";
import { GooglePlacesInput } from "../components/GooglePlacesInput";
import { useLocation } from "../hooks/useLocation";
import { createDeal } from "../lib/api";
import { googleMapsApiKey } from "../lib/config";

const categories: DealCategory[] = ["grocery", "electronics", "fashion", "food", "home", "beauty", "other"];

export function CreateDealPage() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    storeName: "",
    category: "food" as DealCategory,
    address: location?.label || "",
    lat: location?.lat || 34.0522,
    lng: location?.lng || -118.2437,
    price: "",
    discount: "",
    imageUrl: "",
    expiresAt: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await createDeal({
        title: form.title,
        description: form.description,
        storeName: form.storeName,
        category: form.category,
        location: {
          address: form.address,
          lat: form.lat,
          lng: form.lng
        },
        price: form.price ? Number(form.price) : undefined,
        discount: form.discount ? Number(form.discount) : undefined,
        imageUrl: form.imageUrl || undefined,
        expiresAt: new Date(form.expiresAt).toISOString()
      });

      navigate(`/deals/${response.deal.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not post deal");
    } finally {
      setSubmitting(false);
    }
  }

  const locationInput = googleMapsApiKey ? (
    <GooglePlacesInput
      defaultValue={form.address}
      disabled={submitting}
      onSelect={(selection) =>
        setForm((current) => ({
          ...current,
          address: selection.address,
          lat: selection.lat,
          lng: selection.lng,
          storeName: current.storeName || selection.name || current.storeName
        }))
      }
      placeholder="Search for a store or address"
    />
  ) : (
    <input
      className="input"
      disabled={submitting}
      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
      placeholder="Store address"
      value={form.address}
    />
  );

  return (
    <section className="page-section">
      <div className="section-headline">
        <div className="section-heading-copy">
          <p className="eyebrow">Create deal</p>
          <h1 className="page-title">Post it while it&apos;s hot</h1>
        </div>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        <label className="field-stack">
          <span>Deal title</span>
          <input
            className="input"
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="What should people look for?"
            required
            value={form.title}
          />
        </label>

        <div className="two-column-form">
          <label className="field-stack">
            <span>Store name</span>
            <input
              className="input"
              onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
              placeholder="Business or merchant name"
              required
              value={form.storeName}
            />
          </label>

          <label className="field-stack">
            <span>Category</span>
            <select
              className="input"
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as DealCategory }))}
              value={form.category}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field-stack">
          <span>Store location</span>
          {locationInput}
        </label>

        <label className="field-stack">
          <span>Description</span>
          <textarea
            className="input textarea"
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Call out the markdown, stock level, or where in the store to find it."
            required
            rows={5}
            value={form.description}
          />
        </label>

        <div className="three-column-form">
          <label className="field-stack">
            <span>Price</span>
            <input
              className="input"
              inputMode="decimal"
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              placeholder="19.99"
              value={form.price}
            />
          </label>

          <label className="field-stack">
            <span>Discount %</span>
            <input
              className="input"
              inputMode="numeric"
              onChange={(event) => setForm((current) => ({ ...current, discount: event.target.value }))}
              placeholder="40"
              value={form.discount}
            />
          </label>

          <label className="field-stack">
            <span>Expires at</span>
            <input
              className="input"
              onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
              required
              type="datetime-local"
              value={form.expiresAt}
            />
          </label>
        </div>

        <label className="field-stack">
          <span>Optional image URL</span>
          <input
            className="input"
            onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
            placeholder="https://..."
            value={form.imageUrl}
          />
        </label>

        {error ? <div className="inline-error">{error}</div> : null}

        <button className="button button-primary" disabled={submitting} type="submit">
          {submitting ? "Posting..." : "Publish deal"}
        </button>
      </form>
    </section>
  );
}
