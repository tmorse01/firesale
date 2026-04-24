import type { z } from "zod";
import type {
  AdminDealsResponse,
  AdminModerationAction,
  CommentRecord,
  CommentsResponse,
  DealDetailResponse,
  DealFeedItem,
  ImageUploadResponse,
  PaginatedDealsResponse
} from "@firesale/shared";
import { createDealInputSchema } from "@firesale/shared";

export type {
  AdminDealsResponse,
  AdminModerationAction,
  CommentRecord,
  CommentsResponse,
  DealDetailResponse,
  DealFeedItem,
  ImageUploadResponse,
  PaginatedDealsResponse
};
export type CreateDealInput = z.infer<typeof createDealInputSchema>;
