import cors from "cors";
import express from "express";
import {
  commentInputSchema,
  createDealInputSchema,
  dealsQuerySchema,
  requesterSchema,
  voteInputSchema
} from "@firesale/shared";
import { ZodError } from "zod";
import { createDealStore } from "./lib/store.js";

const store = createDealStore();

function getRequester(headers: express.Request["headers"]) {
  return requesterSchema.parse({
    userId: headers["x-firesale-user-id"] ?? "guest-demo",
    username: headers["x-firesale-username"] ?? "Guest Scout"
  });
}

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, mode: "demo-store" });
  });

  app.get("/api/deals", (request, response) => {
    const query = dealsQuerySchema.parse(request.query);
    response.json(
      store.listDeals({
        cursor: query.cursor,
        lat: query.lat,
        lng: query.lng,
        limit: query.limit,
        sort: query.sort,
        userId: request.header("x-firesale-user-id") ?? undefined
      })
    );
  });

  app.get("/api/deals/:id", (request, response) => {
    const lat = request.query.lat ? Number(request.query.lat) : undefined;
    const lng = request.query.lng ? Number(request.query.lng) : undefined;
    const payload = store.getDeal(request.params.id, {
      lat,
      lng,
      userId: request.header("x-firesale-user-id") ?? undefined
    });

    if (!payload) {
      response.status(404).json({ message: "Deal not found." });
      return;
    }

    response.json(payload);
  });

  app.post("/api/deals", (request, response) => {
    const requester = getRequester(request.headers);
    const input = createDealInputSchema.parse(request.body);
    const deal = store.createDeal(requester, input);
    response.status(201).json({ deal });
  });

  app.post("/api/deals/:id/vote", (request, response) => {
    const requester = getRequester(request.headers);
    const body = voteInputSchema.parse(request.body);
    const deal = store.voteDeal(request.params.id, requester, body.value, {
      lat: typeof request.body.lat === "number" ? request.body.lat : undefined,
      lng: typeof request.body.lng === "number" ? request.body.lng : undefined
    });

    if (!deal) {
      response.status(404).json({ message: "Deal not found." });
      return;
    }

    response.json({ deal });
  });

  app.post("/api/deals/:id/expire", (request, response) => {
    getRequester(request.headers);
    const deal = store.expireDeal(request.params.id);
    if (!deal) {
      response.status(404).json({ message: "Deal not found." });
      return;
    }

    response.json({ deal });
  });

  app.get("/api/deals/:id/comments", (request, response) => {
    response.json({ items: store.listComments(request.params.id) });
  });

  app.post("/api/deals/:id/comments", (request, response) => {
    const requester = getRequester(request.headers);
    const body = commentInputSchema.parse(request.body);
    const comment = store.addComment(request.params.id, requester, body.content);
    if (!comment) {
      response.status(404).json({ message: "Deal not found." });
      return;
    }

    response.status(201).json({ comment });
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Validation failed.",
        issues: error.issues.map((issue) => issue.message)
      });
      return;
    }

    response.status(500).json({ message: "Unexpected server error." });
  });

  return app;
}
