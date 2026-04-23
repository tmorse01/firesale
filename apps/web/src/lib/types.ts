import type { z } from "zod";
import type {
  CommentRecord,
  CommentsResponse,
  DealDetailResponse,
  DealFeedItem,
  PaginatedDealsResponse
} from "@firesale/shared";
import { createDealInputSchema } from "@firesale/shared";

export type { CommentRecord, CommentsResponse, DealDetailResponse, DealFeedItem, PaginatedDealsResponse };
export type CreateDealInput = z.infer<typeof createDealInputSchema>;
