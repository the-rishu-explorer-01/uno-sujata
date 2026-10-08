import { randomBytes } from "node:crypto";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/** Human-readable quote reference, e.g. UNO-25K9-3F7A. */
export function makeReference(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = randomBytes(2).toString("hex").toUpperCase();
  return `UNO-${stamp}-${rand}`;
}
