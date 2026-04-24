import type { DealCategory } from "@firesale/shared";

export type IngestionMode = "dry-run" | "publish";

export type BellinghamSourceDefinition = {
  key: string;
  name: string;
  retailer: string;
  sourceUrl: string;
  dealUrl: string;
  storeUrl: string;
  parser:
    | "haggenLocal"
    | "fredMeyerWeeklyAd"
    | "walgreensWeeklyAd"
    | "wholeFoodsStoreSales"
    | "targetWeeklyAdStories";
  storeName: string;
  category: DealCategory;
  expiresAfterHours: number;
  maxPromotionsPerRun?: number;
  pruneMissingAutomatedDeals?: boolean;
  fallbackImageUrl?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
};

export type ExtractedPromotion = {
  title: string;
  description: string;
  category?: DealCategory;
  price?: number;
  discount?: number;
  imageUrl?: string;
  externalId?: string;
  expiresAt?: string;
  confidenceBoost?: number;
  priorityScore?: number;
  dedupeKey?: string;
};

export type AutomatedDealCandidate = {
  title: string;
  description: string;
  storeName: string;
  category: DealCategory;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  price?: number;
  discount?: number;
  imageUrl?: string;
  expiresAt: string;
  isAutomated: true;
  sourceKey: string;
  sourceName: string;
  sourceUrl: string;
  externalId: string;
  confidenceScore: number;
  importedAt: string;
};

export type IngestionItemStatus = "dry-run" | "published" | "duplicate" | "rejected" | "error";

export type IngestionRunItem = {
  sourceKey: string;
  sourceName: string;
  title: string;
  status: IngestionItemStatus;
  reason: string;
  confidenceScore: number;
  dealUrl: string;
  dealId?: string;
};

export type AutomatedIngestionRunRecord = {
  id: string;
  market: "bellingham-wa";
  mode: IngestionMode;
  startedAt: string;
  finishedAt: string;
  minimumDeals: number;
  fetchedCount: number;
  readyCount: number;
  publishedCount: number;
  duplicateCount: number;
  rejectedCount: number;
  errorCount: number;
  metMinimumDeals: boolean;
  sourceKeys: string[];
  notes: string[];
  items: IngestionRunItem[];
};
