import type { NextFunction, Request, Response } from "express";
import { catalogService } from "../services/catalog.service.js";
import { quoteService, quoteInputSchema } from "../services/quote.service.js";
import { HttpError } from "../utils/http.js";

export const catalogController = {
  categories: wrap(async (_req, res) => {
    res.json(await catalogService.categories());
  }),

  products: wrap(async (req, res) => {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    res.json(await catalogService.products(category));
  }),

  productBySlug: wrap(async (req, res) => {
    res.json(await catalogService.productBySlug(String(req.params.slug)));
  }),

  industries: wrap(async (_req, res) => {
    res.json(await catalogService.industries());
  }),

  capabilities: wrap(async (_req, res) => {
    res.json(await catalogService.capabilities());
  }),

  createQuote: wrap(async (req, res) => {
    const parsed = quoteInputSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(422, "Invalid request", parsed.error.flatten().fieldErrors);
    }
    const result = await quoteService.create(parsed.data);
    res.status(201).json({ ok: true, ...result });
  }),
};

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/** Forwards async errors to the Express error middleware. */
function wrap(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
