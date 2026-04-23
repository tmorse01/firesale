import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { CommentsResponse, DealDetailResponse } from "../lib/types";
import { addComment, expireDeal, getComments, getDeal, voteDeal } from "../lib/api";
import { useLocation } from "../hooks/useLocation";
import { StatusBadge } from "../components/StatusBadge";
import { DealCard } from "../components/DealCard";

export function DealPage() {
  const { id = "" } = useParams();
  const { location } = useLocation();
  const [payload, setPayload] = useState<DealDetailResponse | null>(null);
  const [comments, setComments] = useState<CommentsResponse["items"]>([]);
  const [draftComment, setDraftComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function hydrate() {
    const [dealResponse, commentsResponse] = await Promise.all([
      getDeal(id, { lat: location?.lat, lng: location?.lng }),
      getComments(id)
    ]);
    setPayload(dealResponse);
    setComments(commentsResponse.items);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    hydrate()
      .catch((reason: Error) => {
        if (active) {
          setError(reason.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, location?.lat, location?.lng]);

  async function handleVote(value: 1 | -1) {
    await voteDeal(id, value, { lat: location?.lat, lng: location?.lng });
    await hydrate();
  }

  async function handleExpire() {
    await expireDeal(id);
    await hydrate();
  }

  async function handleCommentSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draftComment.trim()) {
      return;
    }

    await addComment(id, draftComment);
    setDraftComment("");
    await hydrate();
  }

  if (loading) {
    return <div className="loading-panel">Loading deal...</div>;
  }

  if (error || !payload) {
    return <div className="inline-error">{error || "Deal not found."}</div>;
  }

  const { deal, relatedDeals } = payload;

  return (
    <section className="page-section detail-page">
      <Link className="back-link" to="/feed?tab=nearby">
        Back to feed
      </Link>

      <article className="detail-hero">
        <div className="detail-hero-media">
          {deal.imageUrl ? <img alt={deal.title} src={deal.imageUrl} /> : <div className="deal-image-fallback" />}
        </div>

        <div className="detail-hero-body">
          <div className="detail-badges">
            <StatusBadge status={deal.status} />
            <span className="detail-time">{deal.timeRemainingLabel}</span>
          </div>
          <h1 className="detail-title">{deal.title}</h1>
          <p className="detail-store">{deal.storeName}</p>
          <p className="detail-address">{deal.location.address}</p>
          <p className="detail-description">{deal.description}</p>

          <div className="detail-metrics">
            <div>
              <span>Discount</span>
              <strong>{deal.discount ? `${deal.discount}% off` : "Deal posted"}</strong>
            </div>
            <div>
              <span>Price</span>
              <strong>{deal.price ? `$${deal.price}` : "Varies"}</strong>
            </div>
            <div>
              <span>Votes</span>
              <strong>{deal.upvotes - deal.downvotes}</strong>
            </div>
          </div>

          <div className="detail-actions">
            <button className={deal.userVote === 1 ? "button button-primary" : "button button-secondary"} onClick={() => void handleVote(1)} type="button">
              Upvote
            </button>
            <button className={deal.userVote === -1 ? "button button-primary" : "button button-secondary"} onClick={() => void handleVote(-1)} type="button">
              Downvote
            </button>
            <button className="button button-ghost" onClick={() => void handleExpire()} type="button">
              Mark expired
            </button>
          </div>
        </div>
      </article>

      <section className="detail-columns">
        <div className="comments-panel">
          <div className="section-headline compact">
            <div>
              <p className="eyebrow">Validation</p>
              <h2>Recent comments</h2>
            </div>
          </div>

          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              className="input textarea"
              onChange={(event) => setDraftComment(event.target.value)}
              placeholder='Try "still active", "stock is low", or "sold out".'
              rows={3}
              value={draftComment}
            />
            <button className="button button-primary" type="submit">
              Add comment
            </button>
          </form>

          <div className="comment-list">
            {comments.map((comment) => (
              <article className="comment-card" key={comment.id}>
                <div className="comment-meta">
                  <strong>{comment.user.username}</strong>
                  <span>{comment.user.reputationScore} rep</span>
                </div>
                <p>{comment.content}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="related-panel">
          <div className="section-headline compact">
            <div>
              <p className="eyebrow">Keep exploring</p>
              <h2>Related nearby deals</h2>
            </div>
          </div>
          <div className="deal-grid single-column">
            {relatedDeals.map((relatedDeal) => (
              <DealCard deal={relatedDeal} key={relatedDeal.id} />
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}
