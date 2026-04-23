import type { CommentRecord, DealFeedItem, DealRecord, DealStatus, UserVote, VoteRecord } from "@firesale/shared";

export function calculateScore(upvotes: number, downvotes: number, createdAt: string): number {
  const hoursSincePost = Math.max(0.25, (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
  const netVotes = upvotes - downvotes;
  if (netVotes <= 0) {
    return Number((netVotes / (hoursSincePost + 2)).toFixed(3));
  }

  return Number(Math.pow(netVotes / (hoursSincePost + 2), 1.5).toFixed(3));
}

export function deriveStatus(deal: DealRecord, votes: VoteRecord[], comments: CommentRecord[]): DealStatus {
  const expiresAt = new Date(deal.expiresAt).getTime();
  const now = Date.now();
  if (deal.manuallyExpiredAt || now >= expiresAt) {
    return "expired";
  }

  const upvotes = votes.filter((vote) => vote.value === 1).length;
  const downvotes = votes.filter((vote) => vote.value === -1).length;
  const negativeComments = comments.filter((comment) =>
    /(sold out|gone|expired|empty|wiped|dead)/i.test(comment.content)
  ).length;

  if (downvotes > upvotes || negativeComments >= 2) {
    return "lowConfidence";
  }

  const minutesRemaining = Math.round((expiresAt - now) / (1000 * 60));
  if (minutesRemaining <= 120) {
    return "expiringSoon";
  }

  return "active";
}

export function formatTimeRemainingLabel(timeRemainingMinutes: number, status: DealStatus): string {
  if (status === "expired" || timeRemainingMinutes <= 0) {
    return "Expired";
  }

  if (timeRemainingMinutes < 60) {
    return `${timeRemainingMinutes}m left`;
  }

  const hours = Math.floor(timeRemainingMinutes / 60);
  const minutes = timeRemainingMinutes % 60;
  if (minutes === 0) {
    return `${hours}h left`;
  }

  return `${hours}h ${minutes}m left`;
}

export function buildDealFeedItem(args: {
  deal: DealRecord;
  comments: CommentRecord[];
  distanceMiles: number | null;
  userVote: UserVote;
  votes: VoteRecord[];
}): DealFeedItem {
  const upvotes = args.votes.filter((vote) => vote.value === 1).length;
  const downvotes = args.votes.filter((vote) => vote.value === -1).length;
  const status = deriveStatus(args.deal, args.votes, args.comments);
  const timeRemainingMinutes = Math.max(
    0,
    Math.round((new Date(args.deal.expiresAt).getTime() - Date.now()) / (1000 * 60))
  );

  return {
    ...args.deal,
    upvotes,
    downvotes,
    commentsCount: args.comments.length,
    score: calculateScore(upvotes, downvotes, args.deal.createdAt),
    status,
    distanceMiles: args.distanceMiles,
    timeRemainingMinutes,
    timeRemainingLabel: formatTimeRemainingLabel(timeRemainingMinutes, status),
    userVote: args.userVote
  };
}
