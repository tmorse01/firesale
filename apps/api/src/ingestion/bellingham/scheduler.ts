import type { BellinghamIngestionService } from "./service.js";

function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function startBellinghamScheduler(service: BellinghamIngestionService): () => void {
  const mode = process.env.FIRESALE_BELLINGHAM_INGEST_MODE === "dry-run" ? "dry-run" : "publish";
  const intervalMinutes = parsePositiveInt(process.env.FIRESALE_BELLINGHAM_INGEST_INTERVAL_MINUTES, 360);
  const minimumDeals = parsePositiveInt(process.env.FIRESALE_BELLINGHAM_MINIMUM_DEALS, 3);
  const runOnBoot = process.env.FIRESALE_BELLINGHAM_INGEST_ON_BOOT !== "false";

  const run = async (trigger: "boot" | "interval") => {
    try {
      const result = await service.run({ mode, minimumDeals });
      console.log(
        `[bellingham-ingestion:${trigger}] ready=${result.readyCount} published=${result.publishedCount} duplicates=${result.duplicateCount} rejected=${result.rejectedCount}`
      );

      if (!result.metMinimumDeals) {
        console.warn(
          `[bellingham-ingestion:${trigger}] minimum daily goal missed: ready=${result.readyCount}, target=${result.minimumDeals}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scheduler error.";
      console.error(`[bellingham-ingestion:${trigger}] ${message}`);
    }
  };

  if (runOnBoot) {
    void run("boot");
  }

  const timer = setInterval(() => {
    void run("interval");
  }, intervalMinutes * 60 * 1000);
  timer.unref();

  return () => clearInterval(timer);
}
