import { createBellinghamIngestionService } from "../ingestion/bellingham/service.js";
import { createDealStore } from "../lib/store.js";

function parseFlagValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

const mode = process.argv.includes("--publish") ? "publish" : "dry-run";
const minimumDeals = Number(parseFlagValue("minimum-deals") ?? "3");
const store = createDealStore();
const service = createBellinghamIngestionService({ store });

const result = await service.run({
  mode,
  minimumDeals: Number.isFinite(minimumDeals) && minimumDeals > 0 ? Math.floor(minimumDeals) : 3
});

console.log(JSON.stringify(result, null, 2));
