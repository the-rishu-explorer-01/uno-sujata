import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  // Log the real error server-side; never leak internals to the client.
  console.error("[api] unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
