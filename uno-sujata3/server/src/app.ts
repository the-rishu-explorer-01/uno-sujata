import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/index.js";
import { sitemapRouter } from "./routes/sitemap.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // Behind a reverse proxy, set TRUST_PROXY to the number of proxies so rate limits see the real client IP.
  app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 0));

  // CORS: an explicit allowlist. Outside production with no list set, allow any origin for local development only.
  const allowlist = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean);
  const origin = allowlist?.length ? allowlist : process.env.NODE_ENV !== "production";
  app.use(
    cors({
      origin,
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Idempotency-Key", "X-RFQ-Token"],
      maxAge: 600,
    })
  );

  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use(sitemapRouter);
  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
