import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { makeReference } from "../utils/http.js";

// Mirrors the frontend schema in src/lib/schemas.ts. Keep both in sync,
// or move the schema into a shared package later.
export const quoteInputSchema = z.object({
  name: z.string().min(2).max(120),
  company: z.string().min(2).max(160),
  email: z.string().email().max(160),
  phone: z.string().min(7).max(30),
  country: z.string().min(2).max(80),
  requirement: z.string().min(20).max(5000),
  quantity: z.string().max(80).optional(),
  hasDrawing: z.boolean(),
});

export const quoteService = {
  async create(input: z.infer<typeof quoteInputSchema>) {
    const reference = makeReference();
    await prisma.quoteRequest.create({ data: { ...input, reference } });
    // TODO: send notification email to the sales/engineering inbox.
    return { reference };
  },
};
