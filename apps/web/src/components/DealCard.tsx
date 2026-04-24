import { Link } from "react-router-dom";
import type { DealFeedItem } from "../lib/types";
import { StatusBadge } from "./StatusBadge";
import { Icon } from "./ui/Icon";

const DESCRIPTION_PREVIEW_LENGTH = 132;

function formatDistance(distanceMiles: number | null) {
  if (distanceMiles === null) {
    return "Local pick";
  }

  return `${distanceMiles.toFixed(1)} mi`;
}

function buildDescriptionPreview(description: string) {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (normalized.length <= DESCRIPTION_PREVIEW_LENGTH) {
    return {
      preview: normalized,
      isTruncated: false
    };
  }

  const truncated = normalized.slice(0, DESCRIPTION_PREVIEW_LENGTH);
  const safeBoundary = Math.max(truncated.lastIndexOf(" "), DESCRIPTION_PREVIEW_LENGTH - 18);
  const preview = truncated.slice(0, safeBoundary).trimEnd();

  return {
    preview: `${preview}...`,
    isTruncated: true
  };
}

export function DealCard({ deal }: { deal: DealFeedItem }) {
  const descriptionPreview = buildDescriptionPreview(deal.description);

  return (
    <Link className="deal-card" to={`/deals/${deal.id}`}>
      <div className="deal-card-media">
        {deal.imageUrl ? (
          <img
            alt={deal.title}
            className="deal-card-image"
            decoding="async"
            loading="lazy"
            src={deal.imageUrl}
          />
        ) : (
          <div className="deal-image-fallback" />
        )}
        <div className="deal-card-overlay">
          <StatusBadge status={deal.status} />
          <span className="deal-timer">{deal.timeRemainingLabel}</span>
        </div>
      </div>

      <div className="deal-card-body">
        <div className="deal-card-topline">
          <span className="deal-inline-meta">
            <Icon name="storefront" />
            {deal.storeName}
          </span>
          <span className="deal-inline-meta">
            <Icon name="place" />
            {formatDistance(deal.distanceMiles)}
          </span>
        </div>
        <h3>{deal.title}</h3>
        <div className="deal-card-description">
          <p>{descriptionPreview.preview}</p>
          {descriptionPreview.isTruncated ? (
            <span className="deal-card-show-more">
              Read full deal
              <Icon name="expand_more" />
            </span>
          ) : null}
        </div>

        <div className="deal-card-meta">
          <strong className="deal-inline-meta">
            <Icon filled name="sell" />
            {deal.discount ? `${deal.discount}% off` : deal.price ? `$${deal.price}` : "Flash deal"}
          </strong>
          <span className="deal-inline-meta">
            <Icon name="comment" />
            {deal.commentsCount} comments
          </span>
          <span className="deal-inline-meta">
            <Icon name="thumb_up" />
            {deal.upvotes - deal.downvotes} score
          </span>
        </div>
      </div>
    </Link>
  );
}
