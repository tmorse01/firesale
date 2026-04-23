import { ChangeEvent, FormEvent, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DealCategory } from "@firesale/shared";
import { GooglePlacesInput } from "../components/GooglePlacesInput";
import { LocationPickerMap } from "../components/LocationPickerMap";
import { FormField } from "../components/ui/FormField";
import { Select } from "../components/ui/Select";
import { TextArea } from "../components/ui/TextArea";
import { TextInput } from "../components/ui/TextInput";
import { useLocation } from "../hooks/useLocation";
import { createDeal, uploadDealImage } from "../lib/api";
import { googleMapsApiKey } from "../lib/config";
import { geocodeAddress } from "../lib/geocoding";
import { Icon } from "../components/ui/Icon";

const categoryOptions = [
  { value: "grocery", label: "Grocery", description: "Produce, pantry, deli, and everyday staples." },
  { value: "electronics", label: "Electronics", description: "Tech markdowns, gadgets, and accessories." },
  { value: "fashion", label: "Fashion", description: "Clothing, shoes, and seasonal style finds." },
  { value: "food", label: "Prepared food", description: "Hot bar, bakery, restaurant, and ready-to-eat deals." },
  { value: "home", label: "Home", description: "Furniture, decor, tools, and household goods." },
  { value: "beauty", label: "Beauty", description: "Skincare, cosmetics, wellness, and self-care items." },
  { value: "other", label: "Other", description: "Anything worth posting that does not fit above." }
] satisfies Array<{ value: DealCategory; label: string; description: string }>;
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxImageSizeBytes = 5 * 1024 * 1024;
const fallbackLocation = { address: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 };

export function CreateDealPage() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const titleFieldId = useId();
  const storeNameFieldId = useId();
  const locationFieldId = useId();
  const descriptionFieldId = useId();
  const priceFieldId = useId();
  const discountFieldId = useId();
  const expiresAtFieldId = useId();
  const imageFieldId = useId();
  const initialLocation = location
    ? { address: location.label, lat: location.lat, lng: location.lng }
    : fallbackLocation;

  const [form, setForm] = useState({
    title: "",
    description: "",
    storeName: "",
    category: "food" as DealCategory,
    address: initialLocation.address,
    lat: initialLocation.lat,
    lng: initialLocation.lng,
    price: "",
    discount: "",
    expiresAt: ""
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationNeedsGeocoding, setLocationNeedsGeocoding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setSelectedImage(null);
      return;
    }

    if (!acceptedImageTypes.includes(file.type)) {
      setSelectedImage(null);
      setError("Choose a PNG, JPG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > maxImageSizeBytes) {
      setSelectedImage(null);
      setError("Images must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setError(null);
  }

  async function resolveLocationForSubmit() {
    const address = form.address.trim();

    if (!address) {
      throw new Error("Enter a store address or drop a pin on the map.");
    }

    if (!googleMapsApiKey || !locationNeedsGeocoding) {
      return {
        address,
        lat: form.lat,
        lng: form.lng
      };
    }

    const selection = await geocodeAddress(address);
    setForm((current) => ({
      ...current,
      address: selection.address,
      lat: selection.lat,
      lng: selection.lng
    }));
    setLocationNeedsGeocoding(false);

    return selection;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setLocationError(null);

    try {
      const resolvedLocation = await resolveLocationForSubmit();
      const imageUrl = selectedImage ? (await uploadDealImage(selectedImage)).imageUrl : undefined;
      const response = await createDeal({
        title: form.title,
        description: form.description,
        storeName: form.storeName,
        category: form.category,
        location: {
          address: resolvedLocation.address,
          lat: resolvedLocation.lat,
          lng: resolvedLocation.lng
        },
        price: form.price ? Number(form.price) : undefined,
        discount: form.discount ? Number(form.discount) : undefined,
        imageUrl,
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
      disabled={submitting}
      id={locationFieldId}
      onChange={(value) => {
        setLocationError(null);
        setLocationNeedsGeocoding(true);
        setForm((current) => ({ ...current, address: value }));
      }}
      onSelect={(selection) => {
        setLocationError(null);
        setLocationNeedsGeocoding(false);
        setForm((current) => ({
          ...current,
          address: selection.address,
          lat: selection.lat,
          lng: selection.lng,
          storeName: current.storeName || selection.name || current.storeName
        }));
      }}
      placeholder="Search for a store or address"
      value={form.address}
    />
  ) : (
    <TextInput
      disabled={submitting}
      id={locationFieldId}
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
          <h1 className="page-title">Post it while it's hot</h1>
        </div>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        <FormField htmlFor={titleFieldId} label="Deal title" required>
          <TextInput
            id={titleFieldId}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="What should people look for?"
            required
            value={form.title}
          />
        </FormField>

        <div className="two-column-form">
          <FormField htmlFor={storeNameFieldId} label="Store name" required>
            <TextInput
              id={storeNameFieldId}
              onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
              placeholder="Business or merchant name"
              required
              value={form.storeName}
            />
          </FormField>

          <FormField hint="Use arrows, typeahead, and enter to choose fast." label="Category" nativeLabel={false}>
            <Select
              onValueChange={(value) => setForm((current) => ({ ...current, category: value as DealCategory }))}
              options={categoryOptions}
              value={form.category}
            />
          </FormField>
        </div>

        <FormField
          htmlFor={locationFieldId}
          hint={googleMapsApiKey ? "Search by business or address, then fine-tune with the map." : "Type the store address manually."}
          label="Store location"
          required
        >
          {locationInput}
        </FormField>

        {googleMapsApiKey ? (
          <LocationPickerMap
            disabled={submitting}
            location={{ address: form.address, lat: form.lat, lng: form.lng }}
            onError={setLocationError}
            onPick={(selection) => {
              setLocationError(null);
              setLocationNeedsGeocoding(false);
              setForm((current) => ({
                ...current,
                address: selection.address,
                lat: selection.lat,
                lng: selection.lng
              }));
            }}
          />
        ) : (
          <p className="location-picker-hint">
            Add a Google Maps key to unlock address autocomplete and map pin placement during posting.
          </p>
        )}

        {locationNeedsGeocoding ? (
          <p className="location-picker-status">We'll resolve this typed address to coordinates when you publish.</p>
        ) : null}

        {locationError ? <div className="inline-error">{locationError}</div> : null}

        <FormField htmlFor={descriptionFieldId} label="Description" required>
          <TextArea
            id={descriptionFieldId}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Call out the markdown, stock level, or where in the store to find it."
            required
            rows={5}
            value={form.description}
          />
        </FormField>

        <div className="three-column-form">
          <FormField htmlFor={priceFieldId} label="Price">
            <TextInput
              id={priceFieldId}
              inputMode="decimal"
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              placeholder="19.99"
              value={form.price}
            />
          </FormField>

          <FormField htmlFor={discountFieldId} label="Discount %">
            <TextInput
              id={discountFieldId}
              inputMode="numeric"
              onChange={(event) => setForm((current) => ({ ...current, discount: event.target.value }))}
              placeholder="40"
              value={form.discount}
            />
          </FormField>

          <FormField htmlFor={expiresAtFieldId} label="Expires at" required>
            <TextInput
              id={expiresAtFieldId}
              onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
              required
              type="datetime-local"
              value={form.expiresAt}
            />
          </FormField>
        </div>

        <FormField htmlFor={imageFieldId} hint="PNG, JPG, WebP, or GIF up to 5 MB." label="Optional image">
          <div className="image-upload-field">
            <TextInput
              accept={acceptedImageTypes.join(",")}
              className="image-upload-input"
              disabled={submitting}
              id={imageFieldId}
              onChange={handleImageChange}
              type="file"
            />
            <p className="image-upload-note">
              <Icon name="add_circle" />
              {selectedImage
                ? `Selected: ${selectedImage.name}`
                : "Upload a PNG, JPG, WebP, or GIF up to 5 MB and we'll host it with the post."}
            </p>
          </div>
        </FormField>

        {error ? <div className="inline-error">{error}</div> : null}

        <button className="button button-primary" disabled={submitting} type="submit">
          <Icon filled name="add_circle" />
          {submitting ? (selectedImage ? "Uploading image..." : "Posting...") : "Publish deal"}
        </button>
      </form>
    </section>
  );
}
