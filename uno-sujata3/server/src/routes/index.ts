import { Router } from "express";
import { catalogController as c } from "../controllers/catalog.controller.js";
import { rfqController as r } from "../controllers/rfq.controller.js";
import { singleDrawing } from "../middleware/upload.js";
import { submitLimiter, uploadLimiter, lookupLimiter } from "../middleware/rateLimit.js";

export const apiRouter = Router();

// Catalogue
apiRouter.get("/products", c.products);
apiRouter.get("/products/:slug", c.productBySlug);
apiRouter.get("/categories", c.categories);
apiRouter.get("/materials", c.materials);
apiRouter.get("/applications", c.applications);
apiRouter.get("/processes", c.processes);
apiRouter.get("/facets", c.facets);

// Company content
apiRouter.get("/industries", c.industries);
apiRouter.get("/capabilities", c.capabilities);

// Request for quotation
apiRouter.post("/rfq/uploads", uploadLimiter, singleDrawing, r.stageUpload);
apiRouter.delete("/rfq/uploads/:id", uploadLimiter, r.discardUpload);
apiRouter.post("/rfq", submitLimiter, r.submit);
apiRouter.get("/rfq/:rfqNumber", lookupLimiter, r.lookup);
