import { Router } from "express";
import { catalogController as c } from "../controllers/catalog.controller.js";

export const apiRouter = Router();

apiRouter.get("/products", c.products);
apiRouter.get("/products/:slug", c.productBySlug);
apiRouter.get("/categories", c.categories);
apiRouter.get("/industries", c.industries);
apiRouter.get("/capabilities", c.capabilities);
apiRouter.post("/quote-requests", c.createQuote);
