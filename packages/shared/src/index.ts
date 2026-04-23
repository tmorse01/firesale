import { z } from "zod";

export const dealSortValues = ["hot", "new", "nearby"] as const;
export const dealCategoryValues = [
  "grocery",
  "electronics",
  "fashion",
  "food",
  "home",
  "beauty",
  "other"
] as const;
export const dealStatusValues = [
  "active",
  "expiringSoon",
  "lowConfidence",
  "expired"
] as const;
export const imageContentTypeValues = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export type DealSort = (typeof dealSortValues)[number];
export type DealCategory = (typeof dealCategoryValues)[number];
export type DealStatus = (typeof dealStatusValues)[number];
export type ImageContentType = (typeof imageContentTypeValues)[number];
export type VoteValue = -1 | 1;
export type UserVote = -1 | 0 | 1;

export type DealRecord = {
  id: string;
  title: string;
  description: string;
  storeName: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  category: DealCategory;
  price?: number;
  discount?: number;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  manuallyExpiredAt?: string;
};

export type CommentRecord = {
  id: string;
  dealId: string;
  userId: string;
  content: string;
  createdAt: string;
};

export type UserRecord = {
  id: string;
  username: string;
  reputationScore: number;
  createdAt: string;
};

export type VoteRecord = {
  id: string;
  dealId: string;
  userId: string;
  value: VoteValue;
  createdAt: string;
};

export type DealFeedItem = DealRecord & {
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  score: number;
  status: DealStatus;
  distanceMiles: number | null;
  timeRemainingMinutes: number;
  timeRemainingLabel: string;
  userVote: UserVote;
};

export type PaginatedDealsResponse = {
  items: DealFeedItem[];
  nextCursor: string | null;
};

export type DealDetailResponse = {
  deal: DealFeedItem;
  relatedDeals: DealFeedItem[];
};

export type CommentsResponse = {
  items: Array<
    CommentRecord & {
      user: Pick<UserRecord, "id" | "username" | "reputationScore">;
    }
  >;
};

export type ImageUploadResponse = {
  imageUrl: string;
};

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().min(3).max(180)
});

export const createDealInputSchema = z.object({
  title: z.string().min(4).max(80),
  description: z.string().min(10).max(600),
  storeName: z.string().min(2).max(80),
  category: z.enum(dealCategoryValues),
  location: locationSchema,
  price: z.number().nonnegative().optional(),
  discount: z.number().min(1).max(100).optional(),
  imageUrl: z.string().url().optional(),
  expiresAt: z.string().datetime()
});

export const imageUploadInputSchema = z.object({
  fileName: z.string().min(1).max(140),
  contentType: z.enum(imageContentTypeValues),
  data: z.string().min(24)
});

export const voteInputSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)])
});

export const commentInputSchema = z.object({
  content: z.string().min(2).max(280)
});

export const dealsQuerySchema = z.object({
  sort: z.enum(dealSortValues).default("nearby"),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().min(1).max(30).default(12),
  cursor: z.string().optional()
});

export const requesterSchema = z.object({
  userId: z.string().min(3).max(80),
  username: z.string().min(2).max(40)
});
