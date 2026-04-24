import type { DealCategory } from "@firesale/shared";
import type { BellinghamSourceDefinition, ExtractedPromotion } from "../types.js";

type MatchBuilder = (match: RegExpExecArray) => ExtractedPromotion;

type PatternDefinition = {
  regex: RegExp;
  build: MatchBuilder;
};

type WalgreensCoupon = {
  activeDateAsUTC?: number;
  brandName?: string;
  categoryName?: string;
  code?: string;
  description?: string;
  expiryDate?: string;
  expiryDateAsUTC?: number;
  id?: string;
  image?: string;
  minQty?: number;
  offerValue?: number;
  programHeadline?: string;
  programSecondLine?: string;
  programThirdLine?: string;
  sneakpeek?: boolean;
  source?: string;
  summary?: string;
  type?: string;
};

type TargetStoryInsert =
  | string
  | {
      targetspecific?: {
        variant?: string;
      };
      text?: string;
    };

type TargetStoryOp = {
  insert?: TargetStoryInsert;
};

type TargetStory = {
  headline?: {
    content?: TargetStoryOp[];
  };
  id?: string;
  image_1x1?: string;
  image_16x9?: string;
  link?: {
    detail?: {
      id?: string;
      name?: string;
      seo_url?: string;
    };
    target?: string;
  };
  subhead?: {
    content?: TargetStoryOp[];
  };
};

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&trade;/gi, "TM")
    .replace(/&reg;/gi, "(R)")
    .replace(/&copy;/gi, "(C)")
    .replace(/&ndash;|&#x2013;|&#8211;/gi, "-")
    .replace(/&mdash;|&#x2014;|&#8212;/gi, "-");
}

function cleanText(input: string | undefined): string {
  return decodeEntities(input ?? "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(input: string | undefined): string {
  return cleanText((input ?? "").replace(/<[^>]+>/g, " "));
}

function htmlToText(html: string): string {
  return cleanText(
    html
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|section|article|header|footer|br|tr|td)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractByPatterns(text: string, patterns: PatternDefinition[]): ExtractedPromotion[] {
  const promotions: ExtractedPromotion[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(text)) !== null) {
      const promotion = pattern.build(match);
      const key = normalizeKey(promotion.title);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      promotions.push({
        ...promotion,
        title: cleanText(promotion.title),
        description: cleanText(promotion.description)
      });
    }
  }

  return promotions;
}

function extractJsonArrayAfterMarker(html: string, marker: string): string | null {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) {
    return null;
  }

  const start = html.indexOf("[", markerIndex + marker.length - 1);
  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < html.length; index += 1) {
    const character = html[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === "\\") {
        isEscaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") {
      inString = true;
      continue;
    }

    if (character === "[") {
      depth += 1;
      continue;
    }

    if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        return html.slice(start, index + 1);
      }
    }
  }

  return null;
}

function parseDollarAmount(input: string | undefined): number | undefined {
  const match = cleanText(input).match(/\$([0-9]+(?:\.[0-9]{1,2})?)/);
  if (!match) {
    return undefined;
  }

  return Number(match[1]);
}

function parsePercent(input: string | undefined): number | undefined {
  const match = cleanText(input).match(/([0-9]+(?:\.[0-9]{1,2})?)\s*%/);
  if (!match) {
    return undefined;
  }

  return Number(match[1]);
}

function parseShortDate(input: string | undefined): { day: number; month: number; year: number } | null {
  const match = cleanText(input).match(/^(\d{2})\/(\d{2})(?:\/(\d{2}))?$/);
  if (!match) {
    return null;
  }

  const currentYear = new Date().getUTCFullYear();
  return {
    month: Number(match[1]),
    day: Number(match[2]),
    year: match[3] ? 2000 + Number(match[3]) : currentYear
  };
}

function toEndOfDayIso(parts: { day: number; month: number; year: number }): string {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 23, 59, 59, 0)).toISOString();
}

function parseExpirationDate(input: string | undefined): string | undefined {
  const parsed = parseShortDate(input);
  return parsed ? toEndOfDayIso(parsed) : undefined;
}

function parseDateRangeEnd(input: string | undefined): string | undefined {
  const cleaned = cleanText(input);
  const match = cleaned.match(/^(\d{2})\/(\d{2})\s*-\s*(\d{2})\/(\d{2})$/);
  if (!match) {
    return undefined;
  }

  const now = new Date();
  let year = now.getUTCFullYear();
  const startMonth = Number(match[1]);
  const endMonth = Number(match[3]);

  if (endMonth < startMonth) {
    year += 1;
  }

  return toEndOfDayIso({
    month: endMonth,
    day: Number(match[4]),
    year
  });
}

function parseWalgreensCoupons(html: string): WalgreensCoupon[] {
  const rawArray = extractJsonArrayAfterMarker(html, "\"coupons\":[");
  if (!rawArray) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawArray) as unknown;
    return Array.isArray(parsed) ? (parsed as WalgreensCoupon[]) : [];
  } catch {
    return [];
  }
}

function categoryForWalgreensCoupon(coupon: WalgreensCoupon): DealCategory {
  const categoryName = cleanText(coupon.categoryName);

  if (/beauty|personal care/i.test(categoryName)) {
    return "beauty";
  }

  if (/household/i.test(categoryName)) {
    return "home";
  }

  return "other";
}

function isProductSpecificWalgreensCoupon(coupon: WalgreensCoupon): boolean {
  const programThirdLine = cleanText(coupon.programThirdLine);
  const brandName = cleanText(coupon.brandName);
  const description = cleanText(coupon.description);
  const summary = cleanText(coupon.summary);

  if (programThirdLine && !/^other$/i.test(programThirdLine)) {
    return true;
  }

  if (brandName && !/^myw exclusive$/i.test(brandName)) {
    return true;
  }

  return /select|toothpaste|deodorant|cosmetics|cream|bath|oral care|paper towels|tissue|laundry|tylenol/i.test(
    `${summary} ${description}`
  );
}

function isLowQualityWalgreensCoupon(coupon: WalgreensCoupon): boolean {
  const text = cleanText(
    [coupon.summary, coupon.programSecondLine, coupon.programThirdLine, coupon.description, coupon.brandName].join(" ")
  );

  if (!text) {
    return true;
  }

  if (/sitewide|clearance|credit card|covid|flu test|vaccine|vaccination/i.test(text)) {
    return true;
  }

  if (/in-store or online/i.test(text) && !isProductSpecificWalgreensCoupon(coupon)) {
    return true;
  }

  if (/spend \$[0-9]+(?:\.[0-9]{1,2})?\+ in-store or online/i.test(text)) {
    return true;
  }

  if (!isProductSpecificWalgreensCoupon(coupon)) {
    return true;
  }

  const value = parseDollarAmount(coupon.summary) ?? coupon.offerValue;
  if (value !== undefined && value < 2) {
    return true;
  }

  return false;
}

function buildWalgreensTitle(coupon: WalgreensCoupon): string {
  const summary = cleanText(coupon.summary);
  const brandName = cleanText(coupon.brandName);

  if (/^\$[0-9]/.test(summary) && brandName && !summary.toLowerCase().includes(brandName.toLowerCase())) {
    return `${summary} ${brandName}`;
  }

  return summary;
}

function buildWalgreensDescription(source: BellinghamSourceDefinition, coupon: WalgreensCoupon): string {
  const detail =
    cleanText(coupon.programSecondLine) ||
    cleanText(coupon.description) ||
    cleanText(coupon.programThirdLine) ||
    "Walgreens currently lists this digital coupon on its official offers page.";
  const expiresText = coupon.expiryDate ? ` Expires ${cleanText(coupon.expiryDate)}.` : "";
  return `${detail}. Available through Walgreens for shoppers using ${source.storeName}.${expiresText}`;
}

function buildWalgreensPriorityScore(coupon: WalgreensCoupon, title: string): number {
  const text = cleanText([title, coupon.programThirdLine, coupon.description].join(" "));
  const value = parseDollarAmount(title) ?? parseDollarAmount(coupon.summary) ?? coupon.offerValue ?? 0;
  let score = value;

  if (isProductSpecificWalgreensCoupon(coupon)) {
    score += 3;
  }

  if (/buy [0-9]+|select/i.test(text)) {
    score += 1;
  }

  if (/beauty|personal care|household/i.test(cleanText(coupon.categoryName))) {
    score += 0.5;
  }

  if (/online only/i.test(cleanText(coupon.description))) {
    score -= 0.25;
  }

  if (coupon.image) {
    score += 0.5;
  }

  return Number(score.toFixed(2));
}

function buildWalgreensPromotion(
  source: BellinghamSourceDefinition,
  coupon: WalgreensCoupon
): ExtractedPromotion | null {
  if (coupon.sneakpeek) {
    return null;
  }

  const now = Date.now();
  if (typeof coupon.activeDateAsUTC === "number" && coupon.activeDateAsUTC > now) {
    return null;
  }

  if (typeof coupon.expiryDateAsUTC === "number" && coupon.expiryDateAsUTC < now) {
    return null;
  }

  if (isLowQualityWalgreensCoupon(coupon)) {
    return null;
  }

  const title = buildWalgreensTitle(coupon);
  const description = buildWalgreensDescription(source, coupon);
  if (title.length < 8 || description.length < 20) {
    return null;
  }

  const priorityScore = buildWalgreensPriorityScore(coupon, title);
  return {
    title,
    description,
    category: categoryForWalgreensCoupon(coupon),
    imageUrl: cleanText(coupon.image),
    externalId: cleanText(coupon.id || coupon.code || title),
    expiresAt: parseExpirationDate(coupon.expiryDate),
    confidenceBoost: priorityScore >= 7 ? 0.28 : priorityScore >= 5 ? 0.24 : 0.2,
    priorityScore,
    dedupeKey: normalizeKey(cleanText(coupon.programThirdLine) || cleanText(coupon.brandName) || title)
  };
}

function parseWholeFoodsTiles(html: string): ExtractedPromotion[] {
  const promotions: ExtractedPromotion[] = [];
  const seen = new Set<string>();
  const tileBlocks = html.match(/<li class='w-sales-tile'[\s\S]*?<\/li>/g) ?? [];

  for (const block of tileBlocks) {
    const imageUrl = cleanText(block.match(/w-sales-tile__image'[^>]*src='([^']+)'/i)?.[1]);
    const brand = stripHtml(block.match(/w-sales-tile__brand'>([\s\S]*?)<\/div>/i)?.[1]);
    const product = stripHtml(block.match(/w-sales-tile__product'>([\s\S]*?)(?:<a class='w-link'|<\/h4>)/i)?.[1]);
    const prices = [...block.matchAll(/w-sales-tile__sale-price w-header3 w-bold-txt'>([^<]*)</gi)]
      .map((match) => cleanText(match[1]))
      .filter(Boolean);
    const regularPrice = cleanText(block.match(/w-sales-tile__regular-price'>([^<]+)</i)?.[1]);
    const validRange = cleanText(block.match(/w-sales-flyer-disclaimer-text'>Valid ([^<]+)</i)?.[1]);

    if (!product || !prices.length) {
      continue;
    }

    const title = cleanText(brand && !product.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${product}` : product);
    const key = normalizeKey(title);
    if (seen.has(key)) {
      continue;
    }

    const primaryPrice = prices[0];
    const secondaryPrice = prices[1];
    const descriptionParts = [`Whole Foods currently lists ${title} on its Bellingham Lakeway weekly sales page.`];

    if (primaryPrice) {
      descriptionParts.push(`Current sale: ${primaryPrice}.`);
    }

    if (secondaryPrice) {
      descriptionParts.push(`Prime price: ${secondaryPrice}.`);
    } else if (regularPrice) {
      descriptionParts.push(`Regular price: ${regularPrice}.`);
    }

    if (validRange) {
      descriptionParts.push(`Valid ${validRange}.`);
    }

    const price = parseDollarAmount(primaryPrice);
    const discount = parsePercent(primaryPrice);
    const priorityScore =
      (price ?? 0) + (discount ?? 0) / 5 + (secondaryPrice ? 1.5 : 0) + (imageUrl ? 0.5 : 0) + (brand ? 0.25 : 0);

    promotions.push({
      title,
      description: descriptionParts.join(" "),
      category: "grocery",
      price,
      discount,
      imageUrl,
      externalId: title,
      expiresAt: parseDateRangeEnd(validRange),
      confidenceBoost: 0.24,
      priorityScore: Number(priorityScore.toFixed(2)),
      dedupeKey: title
    });
    seen.add(key);
  }

  return promotions;
}

function targetRichTextToPlainText(ops: TargetStoryOp[] | undefined): string {
  if (!ops?.length) {
    return "";
  }

  const parts: string[] = [];
  for (const op of ops) {
    const insert = op.insert;
    if (typeof insert === "string") {
      parts.push(insert);
      continue;
    }

    if (insert?.text) {
      parts.push(insert.text);
      continue;
    }

    if (insert?.targetspecific?.variant === "percent-off") {
      parts.push("% off");
    }
  }

  return cleanText(parts.join(""));
}

function parseTargetStories(html: string): TargetStory[] {
  const stories: TargetStory[] = [];
  const seen = new Set<string>();
  let offset = 0;

  while (offset < html.length) {
    const markerIndex = html.indexOf("\"stories\":[", offset);
    if (markerIndex < 0) {
      break;
    }

    const rawArray = extractJsonArrayAfterMarker(html.slice(markerIndex), "\"stories\":[");
    if (!rawArray) {
      break;
    }

    try {
      const parsed = JSON.parse(rawArray) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const story = item as TargetStory;
          const storyKey = story.id ?? `${story.image_1x1 ?? ""}:${targetRichTextToPlainText(story.headline?.content)}`;
          if (!seen.has(storyKey)) {
            stories.push(story);
            seen.add(storyKey);
          }
        }
      }
    } catch {
      // Ignore malformed embedded blocks and continue scanning.
    }

    offset = markerIndex + 10;
  }

  return stories;
}

function isTargetStoryDeal(headline: string, subhead: string): boolean {
  const text = cleanText(`${headline} ${subhead}`);
  if (!text) {
    return false;
  }

  if (!/(\$[0-9]+(?:\.[0-9]{1,2})?)|([0-9]+% off)|buy [0-9]+|free/i.test(text)) {
    return false;
  }

  if (/celebrate|mother|mom|brunch|peak-season|fresh flowers|produce|mindful|kids|essentials/i.test(text)) {
    return false;
  }

  if (!/baby food|spindrift|sparkling water|soda|12-pk|8-pk|good & gather/i.test(text)) {
    return false;
  }

  return true;
}

function buildTargetTitle(headline: string, subhead: string): string {
  if (!headline) {
    return subhead;
  }

  if (!subhead) {
    return headline;
  }

  if (/^sale$/i.test(headline) || /^[0-9]+% off$/i.test(headline) || /^sale \$[0-9]/i.test(headline)) {
    return cleanText(`${headline} ${subhead}`);
  }

  if (/buy [0-9]+, get [0-9]+ free/i.test(headline) || headline.toLowerCase().includes(subhead.toLowerCase())) {
    return cleanText(`${headline} ${subhead}`);
  }

  return cleanText(`${headline} ${subhead}`);
}

function buildTargetDescription(source: BellinghamSourceDefinition, headline: string, subhead: string): string {
  const detail = cleanText(subhead || headline);
  return `Target's grocery weekly ad currently highlights ${detail} for shoppers at ${source.storeName}.`;
}

function buildTargetPriorityScore(title: string, imageUrl: string): number {
  let score = 2;
  const price = parseDollarAmount(title);
  const discount = parsePercent(title);

  if (price !== undefined) {
    score += price;
  }

  if (discount !== undefined) {
    score += discount / 4;
  }

  if (/buy [0-9]+/i.test(title)) {
    score += 1.25;
  }

  if (imageUrl) {
    score += 0.5;
  }

  if (/spindrift|good & gather|baby food|soda/i.test(title)) {
    score += 1.25;
  }

  return Number(score.toFixed(2));
}

function buildTargetPromotions(source: BellinghamSourceDefinition, html: string): ExtractedPromotion[] {
  const promotions: ExtractedPromotion[] = [];

  for (const story of parseTargetStories(html)) {
    const headline = targetRichTextToPlainText(story.headline?.content);
    const subhead = targetRichTextToPlainText(story.subhead?.content);
    if (!isTargetStoryDeal(headline, subhead)) {
      continue;
    }

    const title = buildTargetTitle(headline, subhead);
    const imageUrl = cleanText(story.image_1x1 || story.image_16x9);
    const priorityScore = buildTargetPriorityScore(title, imageUrl);

    promotions.push({
      title,
      description: buildTargetDescription(source, headline, subhead),
      category: source.category,
      price: parseDollarAmount(title),
      discount: parsePercent(title),
      imageUrl,
      externalId: cleanText(story.id || story.link?.detail?.id || title),
      confidenceBoost: 0.22,
      priorityScore,
      dedupeKey: normalizeKey(title)
    });
  }

  return promotions;
}

function fredMeyerPatterns(source: BellinghamSourceDefinition): PatternDefinition[] {
  return [
    {
      regex: /Buy\s+5,\s*Save\s+\$([0-9]+(?:\.[0-9]{2})?)\s+Each/gi,
      build: (match) => ({
        title: `Buy 5, save $${match[1]} each`,
        description: `${source.storeName} surfaces this recurring weekly ad promotion in the Fred Meyer weekly deals navigation.`,
        confidenceBoost: 0.14
      })
    },
    {
      regex: /(\d+)\s+Times Digital Coupons/gi,
      build: (match) => ({
        title: `${match[1]}x digital coupons`,
        description: `${source.storeName} weekly deals page advertises a digital coupon multiplier for current promotions.`,
        confidenceBoost: 0.1
      })
    },
    {
      regex: /(\d+)X Gift Cards/gi,
      build: (match) => ({
        title: `${match[1]}x gift cards rewards`,
        description: `${source.storeName} weekly ad navigation currently calls out an elevated gift card rewards promotion.`,
        confidenceBoost: 0.08
      })
    }
  ];
}

export function extractPromotions(source: BellinghamSourceDefinition, html: string): ExtractedPromotion[] {
  switch (source.parser) {
    case "haggenLocal":
      return [];
    case "fredMeyerWeeklyAd":
      return extractByPatterns(htmlToText(html), fredMeyerPatterns(source));
    case "walgreensWeeklyAd":
      return parseWalgreensCoupons(html)
        .map((coupon) => buildWalgreensPromotion(source, coupon))
        .filter((promotion): promotion is ExtractedPromotion => promotion !== null);
    case "wholeFoodsStoreSales":
      return parseWholeFoodsTiles(html);
    case "targetWeeklyAdStories":
      return buildTargetPromotions(source, html);
    default:
      return [];
  }
}
