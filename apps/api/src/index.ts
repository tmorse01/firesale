import { createApp } from "./app.js";
import { startBellinghamScheduler } from "./ingestion/bellingham/scheduler.js";
import { createApiContext } from "./lib/context.js";

const port = Number(process.env.PORT ?? 4000);
const context = createApiContext();
const app = createApp(context);

app.listen(port, () => {
  console.log(`FireSale API listening on http://localhost:${port}`);

  if (process.env.FIRESALE_ENABLE_BELLINGHAM_SCHEDULER === "true") {
    startBellinghamScheduler(context.bellinghamIngestion);
    console.log("Bellingham ingestion scheduler enabled.");
  }
});
