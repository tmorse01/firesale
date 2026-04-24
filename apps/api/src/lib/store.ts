import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  AdminDealsResponse,
  AdminModerationAction,
  CommentRecord,
  DealDetailResponse,
  DealFeedItem,
  DealRecord,
  PaginatedDealsResponse,
  UserRecord,
  UserVote,
  VoteRecord
} from "@firesale/shared";
import type { AutomatedIngestionRunRecord } from "../ingestion/types.js";
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

type DealStoreState = {
  comments: CommentRecord[];
  deals: DealRecord[];
  ingestionRuns: AutomatedIngestionRunRecord[];
  users: UserRecord[];
  votes: VoteRecord[];
};

export type DealStore = {
  addComment: (dealId: string, requester: Requester, content: string) => CommentRecord | null;
  createDeal: (requester: Requester, input: Omit<DealRecord, "createdAt" | "createdBy" | "id">) => DealFeedItem;
  expireDeal: (dealId: string) => DealFeedItem | null;
  getDeal: (dealId: string, options: { lat?: number; lng?: number; userId?: string }) => DealDetailResponse | null;
  listAdminDeals: (options?: { lat?: number; lng?: number; userId?: string }) => AdminDealsResponse;
  listComments: (dealId: string) => Array<
    CommentRecord & {
      user: Pick<UserRecord, "id" | "reputationScore" | "username">;
    }
  >;
  listDeals: (params: ListDealsParams) => PaginatedDealsResponse;
  listIngestionRuns: (limit?: number) => AutomatedIngestionRunRecord[];
  listRawDeals: () => DealRecord[];
  moderateDeal: (dealId: string, action: AdminModerationAction) => DealFeedItem | null;
  pruneAutomatedDeals: (options: { keepExternalIds: string[]; sourceKey: string }) => number;
  recordIngestionRun: (run: AutomatedIngestionRunRecord) => void;
  upsertAutomatedDeal: (requester: Requester, input: Omit<DealRecord, "createdAt" | "createdBy" | "id">) => DealFeedItem;
  voteDeal: (dealId: string, requester: Requester, value: 1 | -1, location?: { lat?: number; lng?: number }) => DealFeedItem | null;
};

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const defaultStateFilePath = fileURLToPath(new URL("../../runtime/store.json", import.meta.url));

function buildInitialState(): DealStoreState {
  return {
    deals: [],
    users: [],
    comments: [],
    votes: [],
    ingestionRuns: []
  };
}

function loadState(stateFilePath: string): DealStoreState {
  if (!existsSync(stateFilePath)) {
    return buildInitialState();
  }

  try {
    const parsed = JSON.parse(readFileSync(stateFilePath, "utf8")) as Partial<DealStoreState>;
    return {
      deals: Array.isArray(parsed.deals) ? (parsed.deals as DealRecord[]) : [],
      users: Array.isArray(parsed.users) ? (parsed.users as UserRecord[]) : [],
      comments: Array.isArray(parsed.comments) ? (parsed.comments as CommentRecord[]) : [],
      votes: Array.isArray(parsed.votes) ? (parsed.votes as VoteRecord[]) : [],
      ingestionRuns: Array.isArray(parsed.ingestionRuns)
        ? (parsed.ingestionRuns as AutomatedIngestionRunRecord[])
        : []
    };
  } catch {
    return buildInitialState();
  }
}

function persistState(stateFilePath: string, state: DealStoreState) {
  mkdirSync(dirname(stateFilePath), { recursive: true });
  writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
}

export function createDealStore(options?: { stateFilePath?: string }): DealStore {
  const stateFilePath = options?.stateFilePath ?? defaultStateFilePath;
  const state = loadState(stateFilePath);
  const deals = state.deals;
  const users = state.users;
  const comments = state.comments;
  const votes = state.votes;

  function save() {
    persistState(stateFilePath, state);
  }

  function ensureUser(requester: Requester): UserRecord {
    const existing = users.find((user) => user.id === requester.userId);
    if (existing) {
      if (existing.username !== requester.username) {
        existing.username = requester.username;
        save();
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
    save();
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
        .filter((deal) => !deal.hiddenAt && !deal.deletedAt && deal.status !== "expired");

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
      if (!deal || deal.hiddenAt || deal.deletedAt) {
        return null;
      }

      const primary = assembleDeal(deal, options);
      const relatedDeals = deals
        .filter((entry) => entry.id !== dealId && entry.category === deal.category)
        .map((entry) => assembleDeal(entry, options))
        .filter((entry) => !entry.hiddenAt && !entry.deletedAt && entry.status !== "expired")
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
      save();
      return assembleDeal(deal, { userId: requester.userId });
    },

    upsertAutomatedDeal(requester, input) {
      ensureUser(requester);
      const existing = deals.find(
        (deal) =>
          deal.isAutomated === true &&
          deal.sourceKey === input.sourceKey &&
          deal.externalId === input.externalId
      );

      if (!existing) {
        const createdDeal: DealRecord = {
          ...input,
          createdAt: new Date().toISOString(),
          createdBy: requester.userId,
          id: createId("deal")
        };
        deals.unshift(createdDeal);
        save();
        return assembleDeal(createdDeal, { userId: requester.userId });
      }

      Object.assign(existing, input, {
        id: existing.id,
        createdAt: existing.createdAt,
        createdBy: existing.createdBy
      });
      save();
      return assembleDeal(existing, { userId: requester.userId });
    },

    listRawDeals() {
      return [...deals];
    },

    pruneAutomatedDeals(options) {
      const keepExternalIds = new Set(options.keepExternalIds);
      const removedDealIds = deals
        .filter(
          (deal) =>
            deal.isAutomated === true &&
            deal.sourceKey === options.sourceKey &&
            !keepExternalIds.has(deal.externalId ?? "")
        )
        .map((deal) => deal.id);

      if (!removedDealIds.length) {
        return 0;
      }

      const removedDealIdSet = new Set(removedDealIds);

      for (let index = deals.length - 1; index >= 0; index -= 1) {
        if (removedDealIdSet.has(deals[index]?.id ?? "")) {
          deals.splice(index, 1);
        }
      }

      for (let index = comments.length - 1; index >= 0; index -= 1) {
        if (removedDealIdSet.has(comments[index]?.dealId ?? "")) {
          comments.splice(index, 1);
        }
      }

      for (let index = votes.length - 1; index >= 0; index -= 1) {
        if (removedDealIdSet.has(votes[index]?.dealId ?? "")) {
          votes.splice(index, 1);
        }
      }

      save();
      return removedDealIds.length;
    },

    listAdminDeals(options = {}) {
      const items = deals
        .map((deal) => assembleDeal(deal, options))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

      return {
        items,
        stats: {
          automated: items.filter((deal) => deal.isAutomated).length,
          deleted: items.filter((deal) => Boolean(deal.deletedAt)).length,
          expired: items.filter((deal) => deal.status === "expired").length,
          hidden: items.filter((deal) => Boolean(deal.hiddenAt) && !deal.deletedAt).length,
          manual: items.filter((deal) => !deal.isAutomated).length,
          total: items.length,
          visible: items.filter((deal) => !deal.hiddenAt && !deal.deletedAt).length
        }
      };
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

      save();
      return assembleDeal(deal, { lat: location?.lat, lng: location?.lng, userId: requester.userId });
    },

    expireDeal(dealId) {
      const deal = deals.find((entry) => entry.id === dealId);
      if (!deal) {
        return null;
      }

      deal.manuallyExpiredAt = new Date().toISOString();
      save();
      return assembleDeal(deal, {});
    },

    moderateDeal(dealId, action) {
      const deal = deals.find((entry) => entry.id === dealId);
      if (!deal) {
        return null;
      }

      const now = new Date().toISOString();

      if (action === "hide") {
        deal.hiddenAt = now;
      }

      if (action === "unhide") {
        delete deal.hiddenAt;
      }

      if (action === "delete") {
        deal.deletedAt = now;
      }

      if (action === "restore") {
        delete deal.deletedAt;
      }

      if (action === "expire") {
        deal.manuallyExpiredAt = now;
      }

      save();
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
      save();
      return comment;
    },

    recordIngestionRun(run) {
      state.ingestionRuns.unshift(run);
      if (state.ingestionRuns.length > 100) {
        state.ingestionRuns.length = 100;
      }
      save();
    },

    listIngestionRuns(limit = 20) {
      return state.ingestionRuns.slice(0, limit);
    }
  };
}
