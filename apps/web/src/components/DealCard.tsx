import { Link } from "react-router-dom";
import type { DealFeedItem } from "../lib/types";
import { StatusBadge } from "./StatusBadge";
import { Icon } from "./ui/Icon";

function formatDistance(distanceMiles: number | null) {
  if (distanceMiles === null) {
    return "Local pick";
  }

  return `${distanceMiles.toFixed(1)} mi`;
}

export function DealCard({ deal }: { deal: DealFeedItem }) {
  return (
    <Link className="deal-card" to={`/deals/${deal.id}`}>
      <div className="deal-card-media">
        {deal.imageUrl ? <img alt={deal.title} src={deal.imageUrl} /> : <div className="deal-image-fallback" />}
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
        <p>{deal.description}</p>

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
