import { Router } from "express";
import { authController as auth } from "../controllers/admin.auth.controller.js";
import { adminController as a } from "../controllers/admin.controller.js";
import { requireAuth, requireCsrf, requirePermission } from "../middleware/auth.js";
import { adminLimiter, adminLoginLimiter } from "../middleware/rateLimit.js";
import { productImageUpload } from "../middleware/upload.js";

/**
 * Administration API, mounted at /api/admin.
 * Order matters: sign-in is the only route reachable without a session. Everything after it requires a
 * valid session AND a CSRF match for state-changing methods. Each route then checks its own permission.
 */
export const adminRouter = Router();

adminRouter.use(adminLimiter);

adminRouter.post("/auth/login", adminLoginLimiter, auth.login);

adminRouter.use(requireAuth, requireCsrf);

adminRouter.post("/auth/logout", auth.logout);
adminRouter.get("/auth/me", auth.me);
adminRouter.get("/auth/csrf", auth.refreshCsrf);
adminRouter.post("/auth/password", auth.changePassword);

adminRouter.get("/dashboard", requirePermission("dashboard:read"), a.dashboard);

// RFQs
adminRouter.get("/rfqs", requirePermission("rfq:read"), a.listRfqs);
adminRouter.get("/rfqs/:id", requirePermission("rfq:read"), a.getRfq);
adminRouter.patch("/rfqs/:id/status", requirePermission("rfq:update"), a.setRfqStatus);
adminRouter.get("/rfqs/:id/attachments/:attachmentId", requirePermission("rfq:download"), a.downloadAttachment);

// Products
adminRouter.get("/products", requirePermission("product:read"), a.listProducts);
adminRouter.post("/products", requirePermission("product:write"), a.createProduct);
adminRouter.get("/products/:id", requirePermission("product:read"), a.getProduct);
adminRouter.put("/products/:id", requirePermission("product:write"), a.updateProduct);
adminRouter.post("/products/:id/archive", requirePermission("product:write"), a.archiveProduct);
adminRouter.post("/products/:id/restore", requirePermission("product:write"), a.restoreProduct);
adminRouter.post("/products/:id/images", requirePermission("product:write"), productImageUpload, a.addProductImage);
adminRouter.delete("/products/:id/images/:imageId", requirePermission("product:write"), a.removeProductImage);

// Categories
adminRouter.get("/categories", requirePermission("product:read"), a.listCategories);
adminRouter.post("/categories", requirePermission("category:write"), a.createCategory);
adminRouter.post("/categories/reorder", requirePermission("category:write"), a.reorderCategories);
adminRouter.put("/categories/:id", requirePermission("category:write"), a.updateCategory);
adminRouter.post("/categories/:id/archive", requirePermission("category:write"), a.archiveCategory);
adminRouter.post("/categories/:id/restore", requirePermission("category:write"), a.restoreCategory);

// Lookups (materials, applications, processes) for product forms
adminRouter.get("/lookups", requirePermission("product:read"), a.lookups);

// Industries and capabilities (content)
adminRouter.get("/industries", requirePermission("content:read"), a.listIndustries);
adminRouter.post("/industries", requirePermission("content:write"), a.createIndustry);
adminRouter.put("/industries/:id", requirePermission("content:write"), a.updateIndustry);
adminRouter.get("/capabilities", requirePermission("content:read"), a.listCapabilities);
adminRouter.post("/capabilities", requirePermission("content:write"), a.createCapability);
adminRouter.put("/capabilities/:id", requirePermission("content:write"), a.updateCapability);

// CMS content
adminRouter.get("/content", requirePermission("content:read"), a.listContent);
adminRouter.put("/content/:key", requirePermission("content:write"), a.saveContent);

// Contact enquiries
adminRouter.get("/contacts", requirePermission("contact:read"), a.listContacts);
adminRouter.post("/contacts/:id/handled", requirePermission("contact:write"), a.markContactHandled);

// Users (ADMIN only)
adminRouter.get("/users", requirePermission("user:manage"), a.listUsers);
adminRouter.post("/users", requirePermission("user:manage"), a.createUser);
adminRouter.patch("/users/:id", requirePermission("user:manage"), a.updateUser);

// Audit trail
adminRouter.get("/audit", requirePermission("audit:read"), a.audit);

// Anything unmatched under /api/admin is refused with a clear 404, never falls through to public routes.
adminRouter.use((_req, res) => {
  res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
});
