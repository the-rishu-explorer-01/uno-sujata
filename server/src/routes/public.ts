import { Router } from "express";
import { contactLimiter } from "../middleware/rateLimit.js";
import { publicContactBody } from "../lib/adminSchemas.js";
import { getContent } from "../services/content.service.js";
import { createContactEnquiry } from "../services/contact.service.js";
import { HttpError } from "../utils/http.js";

export const publicRouter = Router();

/** Public CMS content: hero, stats, sections, quality, about and contact details. Never includes staff data. */
publicRouter.get("/content", async (_req, res, next) => {
  try {
    res.set("Cache-Control", "public, max-age=60");
    res.json(await getContent());
  } catch (err) {
    next(err);
  }
});

publicRouter.post("/contact", contactLimiter, async (req, res, next) => {
  try {
    const parsed = publicContactBody.safeParse(req.body ?? {});
    if (!parsed.success) throw new HttpError(422, "Please check the highlighted fields.", parsed.error.flatten().fieldErrors);
    await createContactEnquiry({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      company: parsed.data.company,
      message: parsed.data.message,
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});
