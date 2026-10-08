import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HttpError } from "../utils/http.js";
import { MAX_FILE_BYTES } from "../lib/files.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

/**
 * Converts every failure into a safe JSON body. Internal details are logged on the server only.
 * Clients receive a stable `code` they can map to a message, and never a stack trace.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: codeFor(err.status), details: err.details });
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: `File is too large. The maximum size is ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB.`, code: "FILE_TOO_LARGE" });
      return;
    }
    res.status(422).json({ error: "Upload could not be accepted. Attach one file at a time.", code: "UPLOAD_REJECTED" });
    return;
  }

  // Malformed JSON from the browser.
  if (typeof err === "object" && err !== null && (err as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: "The request could not be read. Please try again.", code: "BAD_REQUEST" });
    return;
  }

  console.error("[api] unhandled error:", err);
  res.status(500).json({ error: "Something went wrong on our side. Please try again in a moment.", code: "SERVER_ERROR" });
}

function codeFor(status: number): string {
  switch (status) {
    case 400: return "BAD_REQUEST";
    case 403: return "FORBIDDEN";
    case 404: return "NOT_FOUND";
    case 413: return "FILE_TOO_LARGE";
    case 422: return "VALIDATION_ERROR";
    case 429: return "RATE_LIMITED";
    default: return "ERROR";
  }
}
