const DEFAULT_ENDPOINT = "/api/internal/ingest/bellingham";
const DEFAULT_MINIMUM_DEALS = 3;
const REQUEST_TIMEOUT_MS = 60_000;

function parseFlagValue(name) {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function parseBooleanEnv(name, fallback) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() !== "false";
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

const baseUrl = process.env.FIRESALE_API_URL;

if (!baseUrl) {
  console.error("Set FIRESALE_API_URL before running the Bellingham cron trigger.");
  process.exit(1);
}

const endpoint = parseFlagValue("endpoint") ?? process.env.FIRESALE_INGEST_ENDPOINT ?? DEFAULT_ENDPOINT;
const mode = process.argv.includes("--dry-run") ? "dry-run" : "publish";
const minimumDealsInput = parseFlagValue("minimum-deals") ?? process.env.FIRESALE_MINIMUM_DEALS ?? `${DEFAULT_MINIMUM_DEALS}`;
const minimumDeals = Number(minimumDealsInput);
const failBelowMinimum =
  !process.argv.includes("--allow-below-minimum") &&
  parseBooleanEnv("FIRESALE_FAIL_BELOW_MINIMUM", true);

if (!Number.isFinite(minimumDeals) || minimumDeals < 1) {
  console.error(`Invalid minimum deals value: ${minimumDealsInput}`);
  process.exit(1);
}

const ingestUrl = new URL(endpoint.replace(/^\//, ""), normalizeBaseUrl(baseUrl));
const headers = {
  "content-type": "application/json"
};

if (process.env.FIRESALE_INTERNAL_TOKEN) {
  headers["x-firesale-internal-token"] = process.env.FIRESALE_INTERNAL_TOKEN;
}

const response = await fetch(ingestUrl, {
  method: "POST",
  headers,
  body: JSON.stringify({
    mode,
    minimumDeals: Math.floor(minimumDeals)
  }),
  signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
});

const responseText = await response.text();
let payload = null;

try {
  payload = responseText ? JSON.parse(responseText) : null;
} catch {
  payload = null;
}

if (!response.ok) {
  console.error(`Bellingham cron trigger failed with ${response.status} ${response.statusText}.`);
  if (payload) {
    console.error(JSON.stringify(payload, null, 2));
  } else if (responseText) {
    console.error(responseText);
  }
  process.exit(1);
}

if (payload) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(responseText);
}

if (failBelowMinimum && payload && payload.metMinimumDeals === false) {
  console.error(
    `Bellingham cron completed but did not meet the minimum deal target (${payload.publishedCount ?? payload.readyCount ?? 0}/${payload.minimumDeals ?? Math.floor(minimumDeals)}).`
  );
  process.exit(1);
}
