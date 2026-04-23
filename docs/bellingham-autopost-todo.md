# Bellingham Daily Deal Autopost TODO

Goal: scrape or ingest enough public web deal data to auto-publish at least 3 qualified deals per day for Bellingham, WA.

## Scope

- Launch with one market only: Bellingham, WA.
- Cover a practical city radius first, then expand to nearby areas later.
- Only auto-post deals that can be tied to a real Bellingham-area store or address.
- Prefer public pages, feeds, or APIs that allow automated access. If a source blocks scraping or has restrictive terms, skip it.

## Success Criteria

- At least 3 new Bellingham deals are published automatically every day.
- Auto-posts include the fields the current app already expects:
  - `title`
  - `description`
  - `storeName`
  - `category`
  - `location.lat`
  - `location.lng`
  - `location.address`
  - `price` and/or `discount`
  - `expiresAt`
- Duplicate posts stay below an acceptable threshold.
- Failed scrapes do not break the API or front-end feeds.

## Phase 1: Define The Bellingham Pilot

- [ ] Define the Bellingham service area:
  - City center around Bellingham, WA.
  - Optional radius cap for launch, such as 10-15 miles.
- [ ] Decide which deal types count for MVP:
  - Grocery
  - Food
  - Electronics
  - Home
  - Beauty
- [ ] Set a minimum quality bar:
  - Must have store name
  - Must have price or discount
  - Must have a valid local address or store location
  - Must have an expiration date or a default short TTL
- [ ] Create an initial "publish only if confidence is high" rule so weak matches stay out of the feed.

## Phase 2: Pick Sources That Can Sustain 3+ Deals Per Day

- [ ] Build a starter source list for Bellingham with at least 6-10 candidate sources so we are not depending on one site.
- [ ] Prioritize sources in this order:
  - Public retailer weekly ad pages with store-specific offers
  - Grocery and pharmacy deal pages
  - Restaurant and cafe specials pages
  - Big-box clearance or local promo pages with store selectors
  - Public coupon/deal feeds with location filtering
- [ ] For each source, document:
  - Access method: HTML scrape, RSS/feed, JSON API, or manual fallback
  - Bellingham location support
  - Expected deal volume
  - Update frequency
  - Terms / robots constraints
  - Fields available
- [ ] Mark each source as one of:
  - `auto-publish`
  - `review-first`
  - `reject`

## Phase 3: Add Data Structures For Ingestion

- [ ] Move the API off pure in-memory posting for automated ingestion work.
- [ ] Extend Prisma with ingestion-related tables, for example:
  - `Source`
  - `IngestionRun`
  - `DealCandidate`
  - `SourceLocation`
- [ ] Extend the `Deal` model to support automated provenance:
  - `sourceId`
  - `sourceUrl`
  - `externalId`
  - `isAutomated`
  - `confidenceScore`
  - `importedAt`
- [ ] Add dedupe keys:
  - normalized title
  - store name
  - address
  - price
  - expiration date

## Phase 4: Build The Bellingham Ingestion Pipeline

- [ ] Add a Bellingham source config module, for example:
  - `apps/api/src/ingestion/bellingham/sources.ts`
- [ ] Add one fetcher/parser per source:
  - fetch raw page/feed
  - parse deals
  - normalize fields
  - attach source metadata
- [ ] Normalize raw source output into a shared candidate shape before publishing.
- [ ] Add location validation:
  - confirm the store is in Bellingham service area
  - geocode address if needed
  - reject records outside the launch radius
- [ ] Add category mapping from source labels to current shared categories.
- [ ] Add expiration defaults when a source does not provide one:
  - same-day or 24-hour TTL for flash deals
  - weekly ad end date when clearly available

## Phase 5: Quality Filters Before Auto-Posting

- [ ] Add a confidence score based on:
  - valid local address
  - clear price or percent discount
  - current date freshness
  - trusted source
  - duplicate similarity
- [ ] Reject weak candidates:
  - no Bellingham location
  - stale deals
  - missing core fields
  - generic marketing copy with no actual offer
- [ ] Add duplicate detection against:
  - previously imported candidates
  - already-published deals
- [ ] Set an initial publish threshold:
  - auto-publish above threshold
  - queue below threshold for manual review later

## Phase 6: Auto-Post Into FireSale

- [ ] Add an internal publishing service that converts approved candidates into the existing deal payload.
- [ ] Keep auto-post creation in one place so both scheduled runs and manual backfills use the same code path.
- [ ] Publish with a dedicated system user, for example `bellingham-bot`.
- [ ] Stamp automated deals clearly in the database so they can be monitored, edited, or rolled back.
- [ ] Reuse the existing deal schema and feed ranking so automated content shows up without front-end rewrites.

## Phase 7: Scheduling And Daily Guarantees

- [ ] Add a scheduled job that runs multiple times per day instead of only once.
- [ ] Suggested cadence for launch:
  - early morning scrape
  - late morning scrape
  - mid-afternoon scrape
  - early evening scrape
- [ ] On each run:
  - fetch sources
  - parse candidates
  - dedupe
  - publish qualified deals
  - store metrics
- [ ] Add a daily floor check:
  - if fewer than 3 deals were published today, run fallback sources
  - if still below 3, flag for manual review instead of posting junk

## Phase 8: Admin Visibility And Safety

- [ ] Add basic ingestion logging:
  - source run success/failure
  - candidates found
  - candidates published
  - candidates rejected
- [ ] Add a lightweight internal endpoint or script to run Bellingham ingestion manually.
- [ ] Add a review screen or JSON endpoint for rejected candidates later, but do not block the MVP on a full admin UI.
- [ ] Add kill switches:
  - disable one source
  - disable all autoposts
  - switch a source from auto-publish to review-first

## Phase 9: Seed, Test, And Validate

- [ ] Create a small local fixture set with sample Bellingham candidates for parser tests.
- [ ] Add unit tests for:
  - parsing
  - normalization
  - dedupe
  - confidence scoring
  - radius filtering
- [ ] Add a dry-run mode that logs what would be posted without publishing.
- [ ] Run a 7-day pilot and track:
  - posts per day
  - source hit rate
  - duplicate rate
  - stale/invalid post rate

## Phase 10: First Implementation Slice

- [ ] Replace or supplement the in-memory store with Prisma-backed persistence.
- [ ] Add automated-deal fields to the schema.
- [ ] Build 2-3 reliable Bellingham source adapters first.
- [ ] Add one scheduled ingestion job.
- [ ] Publish deals through a shared internal service.
- [ ] Add logging plus dry-run mode.
- [ ] Verify the pipeline can consistently publish 3+ quality deals per day before expanding beyond Bellingham.

## Suggested File / Module Plan

- `apps/api/prisma/schema.prisma`
  - persist sources, candidates, and automated metadata
- `apps/api/src/ingestion/`
  - source adapters, normalization, dedupe, scoring
- `apps/api/src/jobs/`
  - scheduled ingestion entrypoints
- `apps/api/src/services/`
  - candidate-to-deal publishing service
- `scripts/`
  - manual backfill and dry-run scripts

## Open Decisions

- [ ] Use direct site scraping only, or allow RSS / public APIs when available.
- [ ] Decide whether low-confidence deals should be dropped or held for manual review.
- [ ] Decide whether restaurant specials count toward the daily minimum or if we want only retail-style deals.
- [ ] Decide whether auto-posted deals need a visible UI badge in the first release.
