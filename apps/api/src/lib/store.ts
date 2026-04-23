import type {
  CommentRecord,
  DealDetailResponse,
  DealFeedItem,
  DealRecord,
  PaginatedDealsResponse,
  UserRecord,
  UserVote
} from "@firesale/shared";
import { buildDemoData } from "../data/demo.js";
import { haversineMiles } from "./geo.js";
import { buildDealFeedItem } from "./scoring.js";

type Requester = {
  userId: string;
  username: string;
};

type ListDealsParams = {
  cursor?: string;
  lat?: number;
  lng?: number;
  limit: number;
  sort: "hot" | "new" | "nearby";
  userId?: string;
};

type DealStore = {
  addComment: (dealId: string, requester: Requester, content: string) => CommentRecord | null;
  createDeal: (requester: Requester, input: Omit<DealRecord, "createdAt" | "createdBy" | "id">) => DealFeedItem;
  expireDeal: (dealId: string) => DealFeedItem | null;
  getDeal: (dealId: string, options: { lat?: number; lng?: number; userId?: string }) => DealDetailResponse | null;
  listComments: (dealId: string) => Array<
    CommentRecord & {
      user: Pick<UserRecord, "id" | "reputationScore" | "username">;
    }
  >;
  listDeals: (params: ListDealsParams) => PaginatedDealsResponse;
  voteDeal: (dealId: string, requester: Requester, value: 1 | -1, location?: { lat?: number; lng?: number }) => DealFeedItem | null;
};

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDealStore(): DealStore {
  const seed = buildDemoData();
  const deals = [...seed.deals];
  const users = [...seed.users];
  const comments = [...seed.comments];
  const votes = [...seed.votes];

  function ensureUser(requester: Requester): UserRecord {
    const existing = users.find((user) => user.id === requester.userId);
    if (existing) {
      if (existing.username !== requester.username) {
        existing.username = requester.username;
      }
      return existing;
    }

    const createdUser: UserRecord = {
      id: requester.userId,
      username: requester.username,
      reputationScore: 1,
      createdAt: new Date().toISOString()
    };
    users.push(createdUser);
    return createdUser;
  }

  function assembleDeal(deal: DealRecord, options: { lat?: number; lng?: number; userId?: string }): DealFeedItem {
    const dealVotes = votes.filter((vote) => vote.dealId === deal.id);
    const dealComments = comments.filter((comment) => comment.dealId === deal.id);
    const distanceMiles =
      options.lat !== undefined && options.lng !== undefined
        ? haversineMiles(options.lat, options.lng, deal.location.lat, deal.location.lng)
        : null;
    const userVote = (dealVotes.find((vote) => vote.userId === options.userId)?.value ?? 0) as UserVote;

    return buildDealFeedItem({
      deal,
      comments: dealComments,
      distanceMiles,
      userVote,
      votes: dealVotes
    });
  }

  return {
    listDeals(params) {
      const startIndex = Number(params.cursor ?? "0");
      const assembled = deals
        .map((deal) => assembleDeal(deal, params))
        .filter((deal) => deal.status !== "expired");

      const sorted = [...assembled].sort((left, right) => {
        if (params.sort === "nearby" && left.distanceMiles !== null && right.distanceMiles !== null) {
          return left.distanceMiles - right.distanceMiles || right.score - left.score;
        }

        if (params.sort === "hot") {
          return right.score - left.score || right.upvotes - left.upvotes;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });

      const items = sorted.slice(startIndex, startIndex + params.limit);
      const nextCursor = startIndex + params.limit < sorted.length ? String(startIndex + params.limit) : null;
      return { items, nextCursor };
    },

    getDeal(dealId, options) {
      const deal = deals.find((entry) => entry.id === dealId);
      if (!deal) {
        return null;
      }

      const primary = assembleDeal(deal, options);
      const relatedDeals = deals
        .filter((entry) => entry.id !== dealId && entry.category === deal.category)
        .map((entry) => assembleDeal(entry, options))
        .filter((entry) => entry.status !== "expired")
        .sort((left, right) => right.score - left.score)
        .slice(0, 3);

      return { deal: primary, relatedDeals };
    },

    createDeal(requester, input) {
      ensureUser(requester);
      const deal: DealRecord = {
        ...input,
        createdAt: new Date().toISOString(),
        createdBy: requester.userId,
        id: createId("deal")
      };
      deals.unshift(deal);
      return assembleDeal(deal, { userId: requester.userId });
    },

    voteDeal(dealId, requester, value, location) {
      ensureUser(requester);
      const deal = deals.find((entry) => entry.id === dealId);
      if (!deal) {
        return null;
      }

      const existing = votes.find((vote) => vote.dealId === dealId && vote.userId === requester.userId);
      if (existing && existing.value === value) {
        votes.splice(votes.indexOf(existing), 1);
      } else if (existing) {
        existing.value = value;
        existing.createdAt = new Date().toISOString();
      } else {
        votes.push({
          id: createId("vote"),
          dealId,
          userId: requester.userId,
          value,
          createdAt: new Date().toISOString()
        });
      }

      return assembleDeal(deal, { lat: location?.lat, lng: location?.lng, userId: requester.userId });
    },

    expireDeal(dealId) {
      const deal = deals.find((entry) => entry.id === dealId);
      if (!deal) {
        return null;
      }

      deal.manuallyExpiredAt = new Date().toISOString();
      return assembleDeal(deal, {});
    },

    listComments(dealId) {
      return comments
        .filter((comment) => comment.dealId === dealId)
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .map((comment) => {
          const user = users.find((entry) => entry.id === comment.userId);
          return {
            ...comment,
            user: {
              id: user?.id ?? comment.userId,
              username: user?.username ?? "Guest",
              reputationScore: user?.reputationScore ?? 0
            }
          };
        });
    },

    addComment(dealId, requester, content) {
      ensureUser(requester);
      const deal = deals.find((entry) => entry.id === dealId);
      if (!deal) {
        return null;
      }

      const comment: CommentRecord = {
        id: createId("comment"),
        dealId,
        userId: requester.userId,
        content,
        createdAt: new Date().toISOString()
      };
      comments.push(comment);
      return comment;
    }
  };
}
