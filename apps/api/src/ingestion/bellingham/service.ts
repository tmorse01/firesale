import { randomUUID } from "node:crypto";
import type { DealRecord } from "@firesale/shared";
import type { DealStore } from "../../lib/store.js";
import { bellinghamSources } from "./sources.js";
import { extractPromotions } from "./parsers.js";
import type {
  AutomatedDealCandidate,
  AutomatedIngestionRunRecord,
  BellinghamSourceDefinition,
  ExtractedPromotion,
  IngestionMode,
  IngestionRunItem
} from "../types.js";

type RunOptions = {
  minimumDeals?: number;
  mode?: IngestionMode;
};

export type BellinghamIngestionService = {
  listSources: () => BellinghamSourceDefinition[];
  run: (options?: RunOptions) => Promise<AutomatedIngestionRunRecord>;
};

const botRequester = {
  userId: "bellingham-bot",
  username: "Bellingham Bot"
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, "-");
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trim()}...`;
}

function createExternalId(sourceKey: string, promotion: ExtractedPromotion): string {
  return `${sourceKey}:${promotion.externalId ? slugify(promotion.externalId) : slugify(promotion.title)}`;
}

function buildConfidenceScore(source: BellinghamSourceDefinition, candidate: Omit<AutomatedDealCandidate, "confidenceScore">): number {
  let score = 0.55;

  if (candidate.location.address.includes("Bellingham")) {
    score += 0.1;
  }

  if (candidate.discount !== undefined) {
    score += 0.15;
  }

  if (candidate.price !== undefined) {
    score += 0.1;
  }

  if (candidate.imageUrl) {
    score += 0.05;
  }

  if (source.retailer === "Walgreens") {
    score += 0.05;
  }

  return Math.min(0.99, Number(score.toFixed(2)));
}

function buildCandidate(source: BellinghamSourceDefinition, promotion: ExtractedPromotion): AutomatedDealCandidate {
  const importedAt = new Date().toISOString();
  const externalId = createExternalId(source.key, promotion);
  const description = truncate(
    `${promotion.description} Auto-posted from ${source.retailer}'s official offer page for ${source.storeName}.`,
    600
  );
  const expiresAt = promotion.expiresAt ?? new Date(Date.now() + source.expiresAfterHours * 60 * 60 * 1000).toISOString();
  const draftCandidate = {
    title: truncate(promotion.title, 80),
    description: description.length >= 10 ? description : `${description} Current offer imported automatically.`,
    storeName: source.storeName,
    category: promotion.category ?? source.category,
    location: source.location,
    price: promotion.price,
    discount: promotion.discount,
    imageUrl: promotion.imageUrl ?? source.fallbackImageUrl,
    expiresAt,
    isAutomated: true as const,
    sourceKey: source.key,
    sourceName: source.name,
    sourceUrl: source.dealUrl,
    externalId,
    importedAt
  };

  return {
    ...draftCandidate,
    confidenceScore: Math.min(
      0.99,
      Number((buildConfidenceScore(source, draftCandidate) + (promotion.confidenceBoost ?? 0)).toFixed(2))
    )
  };
}

const genericTitlePatterns = [
  /top members save/i,
  /sitewide/i,
  /clearance/i,
  /covid/i,
  /flu test/i,
  /credit card/i,
  /7 days of savings/i,
  /driveup\s*&\s*go/i,
  /first .*order/i,
  /spend \$[0-9]+(?:\.[0-9]{1,2})?\+ in-store or online/i
];

function validateCandidate(candidate: AutomatedDealCandidate): string | null {
  if (!candidate.location.address.includes("Bellingham")) {
    return "Candidate is outside the Bellingham launch market.";
  }

  if (candidate.confidenceScore < 0.6) {
    return "Candidate confidence is below the auto-publish threshold.";
  }

  if (candidate.title.length < 4) {
    return "Candidate title is too short.";
  }

  if (candidate.description.length < 10) {
    return "Candidate description is too short.";
  }

  if (genericTitlePatterns.some((pattern) => pattern.test(candidate.title))) {
    return "Candidate title is too generic for automatic publishing.";
  }

  return null;
}

function selectPromotions(source: BellinghamSourceDefinition, promotions: ExtractedPromotion[]): ExtractedPromotion[] {
  const sorted = [...promotions].sort((left, right) => {
    return (right.priorityScore ?? right.confidenceBoost ?? 0) - (left.priorityScore ?? left.confidenceBoost ?? 0);
  });
  const deduped: ExtractedPromotion[] = [];
  const seen = new Set<string>();

  for (const promotion of sorted) {
    const key = normalizeText(promotion.dedupeKey ?? promotion.externalId ?? promotion.title);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(promotion);
  }

  return deduped.slice(0, source.maxPromotionsPerRun ?? deduped.length);
}

function findDuplicate(existingDeals: DealRecord[], candidate: AutomatedDealCandidate): string | null {
  for (const deal of existingDeals) {
    if (
      normalizeText(deal.storeName) === normalizeText(candidate.storeName) &&
      normalizeText(deal.title) === normalizeText(candidate.title)
    ) {
      return "A matching deal title already exists for this store.";
    }
  }

  return null;
}

function findExistingAutomatedDeal(existingDeals: DealRecord[], candidate: AutomatedDealCandidate): DealRecord | null {
  return (
    existingDeals.find(
      (deal) =>
        deal.isAutomated === true &&
        deal.sourceKey === candidate.sourceKey &&
        deal.externalId === candidate.externalId
    ) ?? null
  );
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "FireSaleBot/0.1 (+https://firesale.local)"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Received ${response.status} from ${url}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function createBellinghamIngestionService(args: { store: DealStore }): BellinghamIngestionService {
  return {
    listSources() {
      return [...bellinghamSources];
    },

    async run(options) {
      const mode = options?.mode ?? "dry-run";
      const minimumDeals = options?.minimumDeals ?? 3;
      const startedAt = new Date().toISOString();
      const items: IngestionRunItem[] = [];
      const notes: string[] = [];
      let existingDeals = args.store.listRawDeals();
      let fetchedCount = 0;
      let readyCount = 0;
      let publishedCount = 0;
      let duplicateCount = 0;
      let rejectedCount = 0;
      let errorCount = 0;

      for (const source of bellinghamSources) {
        try {
          const html = await fetchHtml(source.sourceUrl);
          const promotions = selectPromotions(source, extractPromotions(source, html));
          const retainedExternalIds: string[] = [];

          if (!promotions.length) {
            notes.push(`No promotions were extracted from ${source.name}.`);
            if (mode === "publish" && source.pruneMissingAutomatedDeals) {
              const prunedCount = args.store.pruneAutomatedDeals({
                sourceKey: source.key,
                keepExternalIds: []
              });
              if (prunedCount > 0) {
                notes.push(`Pruned ${prunedCount} stale automated deals from ${source.name}.`);
                existingDeals = args.store.listRawDeals();
              }
            }
            continue;
          }

          for (const promotion of promotions) {
            fetchedCount += 1;
            const candidate = buildCandidate(source, promotion);
            const invalidReason = validateCandidate(candidate);
            if (invalidReason) {
              rejectedCount += 1;
              items.push({
                sourceKey: source.key,
                sourceName: source.name,
                title: candidate.title,
                status: "rejected",
                reason: invalidReason,
                confidenceScore: candidate.confidenceScore,
                dealUrl: source.dealUrl
              });
              continue;
            }

            retainedExternalIds.push(candidate.externalId);
            const existingAutomatedDeal = findExistingAutomatedDeal(existingDeals, candidate);
            if (existingAutomatedDeal) {
              if (mode === "dry-run") {
                duplicateCount += 1;
                items.push({
                  sourceKey: source.key,
                  sourceName: source.name,
                  title: candidate.title,
                  status: "duplicate",
                  reason: "This automated offer already exists and would be refreshed on publish.",
                  confidenceScore: candidate.confidenceScore,
                  dealUrl: source.dealUrl,
                  dealId: existingAutomatedDeal.id
                });
                continue;
              }

              const refreshedDeal = args.store.upsertAutomatedDeal(botRequester, candidate);
              existingDeals = args.store.listRawDeals();
              publishedCount += 1;
              items.push({
                sourceKey: source.key,
                sourceName: source.name,
                title: candidate.title,
                status: "published",
                reason: "Updated existing automated deal.",
                confidenceScore: candidate.confidenceScore,
                dealUrl: source.dealUrl,
                dealId: refreshedDeal.id
              });
              continue;
            }

            const duplicateReason = findDuplicate(existingDeals, candidate);
            if (duplicateReason) {
              duplicateCount += 1;
              items.push({
                sourceKey: source.key,
                sourceName: source.name,
                title: candidate.title,
                status: "duplicate",
                reason: duplicateReason,
                confidenceScore: candidate.confidenceScore,
                dealUrl: source.dealUrl
              });
              continue;
            }

            readyCount += 1;
            if (mode === "dry-run") {
              items.push({
                sourceKey: source.key,
                sourceName: source.name,
                title: candidate.title,
                status: "dry-run",
                reason: "Candidate is ready to publish.",
                confidenceScore: candidate.confidenceScore,
                dealUrl: source.dealUrl
              });
              continue;
            }

            const createdDeal = args.store.createDeal(botRequester, candidate);
            existingDeals = args.store.listRawDeals();
            publishedCount += 1;
            items.push({
              sourceKey: source.key,
              sourceName: source.name,
              title: candidate.title,
              status: "published",
              reason: "Published automatically.",
              confidenceScore: candidate.confidenceScore,
              dealUrl: source.dealUrl,
              dealId: createdDeal.id
            });
          }

          if (mode === "publish" && source.pruneMissingAutomatedDeals) {
            const prunedCount = args.store.pruneAutomatedDeals({
              sourceKey: source.key,
              keepExternalIds: retainedExternalIds
            });
            if (prunedCount > 0) {
              notes.push(`Pruned ${prunedCount} stale automated deals from ${source.name}.`);
              existingDeals = args.store.listRawDeals();
            }
          }
        } catch (error) {
          errorCount += 1;
          const message = error instanceof Error ? error.message : "Unknown scrape error.";
          notes.push(`Failed to fetch ${source.name}: ${message}`);
          items.push({
            sourceKey: source.key,
            sourceName: source.name,
            title: source.name,
            status: "error",
            reason: message,
            confidenceScore: 0,
            dealUrl: source.dealUrl
          });
        }
      }

      const finishedAt = new Date().toISOString();
      const metMinimumDeals = mode === "publish" ? publishedCount >= minimumDeals : readyCount >= minimumDeals;
      const run: AutomatedIngestionRunRecord = {
        id: `ingestion-${randomUUID()}`,
        market: "bellingham-wa",
        mode,
        startedAt,
        finishedAt,
        minimumDeals,
        fetchedCount,
        readyCount,
        publishedCount,
        duplicateCount,
        rejectedCount,
        errorCount,
        metMinimumDeals,
        sourceKeys: bellinghamSources.map((source) => source.key),
        notes,
        items
      };

      if (!run.metMinimumDeals) {
        if (mode === "publish") {
          run.notes.push(`Published candidate count (${publishedCount}) is below the minimum daily target (${minimumDeals}).`);
        } else {
          run.notes.push(`Ready candidate count (${readyCount}) is below the minimum daily target (${minimumDeals}).`);
        }
      }

      args.store.recordIngestionRun(run);
      return run;
    }
  };
}
