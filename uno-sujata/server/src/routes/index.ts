import { Router } from "express";
import { catalogController as c } from "../controllers/catalog.controller.js";

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

// Leads
apiRouter.post("/quote-requests", c.createQuote);
