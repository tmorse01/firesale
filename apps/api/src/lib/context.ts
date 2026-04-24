import { createBellinghamIngestionService } from "../ingestion/bellingham/service.js";
import { createDealStore } from "./store.js";

export function createApiContext() {
  const store = createDealStore();

  return {
    store,
    bellinghamIngestion: createBellinghamIngestionService({ store })
  };
}

export type ApiContext = ReturnType<typeof createApiContext>;
