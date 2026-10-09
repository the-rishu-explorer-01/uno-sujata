/**
 * Administration API client. Same-origin only: the session cookie is HttpOnly, so this code never
 * sees the session. It echoes the CSRF cookie in a header on every state-changing request.
 * Server-side checks are the security boundary; this file only shapes requests and messages.
 */

export class AdminApiError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string[]>;
  constructor(status: number, message: string, code?: string, fields?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const UNAUTHORIZED_EVENT = "uno-admin:unauthorized";

export function onUnauthorized(callback: () => void): () => void {
  window.addEventListener(UNAUTHORIZED_EVENT, callback);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, callback);
}

function csrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)uno_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function readError(res: Response, path: string): Promise<AdminApiError> {
  const body = (await res.json().catch(() => null)) as { error?: string; code?: string; details?: Record<string, string[]> } | null;
  const err = new AdminApiError(
    res.status,
    body?.error ?? "Something went wrong. Please try again.",
    body?.code,
    body?.details && typeof body.details === "object" && !Array.isArray(body.details) ? body.details : undefined
  );
  // A 401 anywhere except sign-in means the session has ended: let the app return to the login screen.
  if (res.status === 401 && !path.startsWith("/auth/login")) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  return err;
}

async function request<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-CSRF-Token"] = csrfToken();

  let res: Response;
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new AdminApiError(0, "We could not reach the server. Check your connection and try again.", "NETWORK");
  }
  if (!res.ok) throw await readError(res, path);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ user: AdminUser; expiresAt: string }>("POST", "/auth/login", { email, password }),
  logout: () => request<void>("POST", "/auth/logout"),
  me: () => request<{ user: AdminUser }>("GET", "/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>("POST", "/auth/password", { currentPassword, newPassword }),

  dashboard: () => request<DashboardData>("GET", "/dashboard"),

  rfqs: (q: URLSearchParams) => request<Paged<RfqRow>>("GET", `/rfqs?${q}`),
  rfq: (id: string) => request<RfqDetail>("GET", `/rfqs/${id}`),
  setRfqStatus: (id: string, status: RfqStatus) => request<{ status: RfqStatus; changed: boolean }>("PATCH", `/rfqs/${id}/status`, { status }),

  products: (q: URLSearchParams) => request<Paged<ProductRow>>("GET", `/products?${q}`),
  product: (id: string) => request<ProductDetail>("GET", `/products/${id}`),
  createProduct: (body: ProductBody) => request<{ id: string; slug: string }>("POST", "/products", body),
  updateProduct: (id: string, body: ProductBody) => request<{ id: string; slug: string }>("PUT", `/products/${id}`, body),
  archiveProduct: (id: string) => request<void>("POST", `/products/${id}/archive`),
  restoreProduct: (id: string) => request<void>("POST", `/products/${id}/restore`),
  removeImage: (productId: string, imageId: string) => request<void>("DELETE", `/products/${productId}/images/${imageId}`),
  uploadImage: async (productId: string, file: File, alt: string): Promise<{ id: string; url: string; alt: string }> => {
    const form = new FormData();
    form.append("image", file);
    form.append("alt", alt);
    let res: Response;
    try {
      res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: form,
        headers: { "X-CSRF-Token": csrfToken() },
        credentials: "same-origin",
      });
    } catch {
      throw new AdminApiError(0, "We could not reach the server. Check your connection and try again.", "NETWORK");
    }
    if (!res.ok) throw await readError(res, "/products/images");
    return res.json();
  },

  categories: () => request<CategoryRow[]>("GET", "/categories"),
  createCategory: (body: { name: string; summary: string }) => request<{ id: string }>("POST", "/categories", body),
  updateCategory: (id: string, body: { name: string; summary: string }) => request<void>("PUT", `/categories/${id}`, body),
  archiveCategory: (id: string) => request<void>("POST", `/categories/${id}/archive`),
  restoreCategory: (id: string) => request<void>("POST", `/categories/${id}/restore`),
  reorderCategories: (ids: string[]) => request<void>("POST", "/categories/reorder", { ids }),

  lookups: () => request<Lookups>("GET", "/lookups"),

  industries: () => request<ListItem[]>("GET", "/industries"),
  createIndustry: (body: { name: string; summary: string }) => request<{ id: string }>("POST", "/industries", body),
  updateIndustry: (id: string, body: { name: string; summary: string }) => request<void>("PUT", `/industries/${id}`, body),
  capabilities: () => request<ListItem[]>("GET", "/capabilities"),
  createCapability: (body: { title: string; description: string }) => request<{ id: string }>("POST", "/capabilities", body),
  updateCapability: (id: string, body: { title: string; description: string }) => request<void>("PUT", `/capabilities/${id}`, body),

  content: () => request<Record<string, unknown>>("GET", "/content"),
  saveContent: (key: string, value: unknown) => request<{ key: string; value: unknown }>("PUT", `/content/${key}`, { value }),

  contacts: (q: URLSearchParams) => request<Paged<ContactRow>>("GET", `/contacts?${q}`),
  markContactHandled: (id: string) => request<void>("POST", `/contacts/${id}/handled`),

  users: () => request<UserRow[]>("GET", "/users"),
  createUser: (body: { email: string; name: string; role: "ADMIN" | "EDITOR"; password: string }) => request<UserRow>("POST", "/users", body),
  updateUser: (id: string, body: { role?: "ADMIN" | "EDITOR"; active?: boolean; password?: string }) => request<UserRow>("PATCH", `/users/${id}`, body),
};

// ---- DTOs (mirror the server responses) ----

export type RfqStatus = "NEW" | "UNDER_REVIEW" | "TECHNICAL_REVIEW" | "QUOTE_PREPARED" | "CLOSED";
export const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  NEW: "New",
  UNDER_REVIEW: "Under review",
  TECHNICAL_REVIEW: "Technical review",
  QUOTE_PREPARED: "Quote prepared",
  CLOSED: "Closed",
};

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RfqRow {
  id: string;
  rfqNumber: string;
  name: string;
  company: string;
  email: string;
  status: RfqStatus;
  createdAt: string;
  productNames: string[];
  attachmentCount: number;
}

export interface RfqDetail {
  id: string;
  rfqNumber: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  industry: string | null;
  partNumber: string | null;
  quantity: string | null;
  material: string | null;
  finish: string | null;
  application: string | null;
  deliveryRequirement: string | null;
  message: string;
  status: RfqStatus;
  createdAt: string;
  updatedAt: string;
  attachments: { id: string; originalName: string; mimeType: string; extension: string; sizeBytes: number; createdAt: string }[];
  products: { id: string; productNameSnapshot: string; productCodeSnapshot: string | null; categorySnapshot: string | null; productId: string | null }[];
  history: { id: string; action: string; summary: string; createdAt: string; actor: { name: string } | null }[];
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  productCode: string | null;
  productType: string;
  published: boolean;
  featured: boolean;
  verified: boolean;
  archivedAt: string | null;
  updatedAt: string;
  categoryName: string;
  imageCount: number;
}

export interface ProductBody {
  name: string;
  slug?: string;
  productCode?: string | null;
  productType: string;
  description: string;
  categoryId: string;
  materialIds: string[];
  applicationIds: string[];
  processIds: string[];
  finishes: string[];
  specifications: { label: string; value: string }[];
  verified: boolean;
  published: boolean;
  featured: boolean;
}

export interface ProductDetail extends ProductBody {
  id: string;
  archivedAt: string | null;
  images: { id: string; url: string; alt: string; sortOrder: number }[];
  materialNames: string[];
  applicationNames: string[];
  processNames: string[];
  categoryName: string;
  updatedAt: string;
}

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  summary: string;
  sortOrder: number;
  archivedAt: string | null;
  productCount: number;
}

export interface Lookups {
  materials: { id: string; name: string; slug: string }[];
  applications: { id: string; name: string; slug: string }[];
  processes: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
}

export interface ListItem {
  id: string;
  slug: string;
  name?: string;
  title?: string;
  summary?: string;
  description?: string;
  sortOrder: number;
}

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: "NEW" | "HANDLED";
  createdAt: string;
  handledAt: string | null;
}

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface DashboardData {
  rfq: {
    newCount: number;
    openCount: number;
    thisWeek: number;
    lastWeek: number;
    byStatus: { status: RfqStatus; label: string; count: number }[];
    recent: { id: string; rfqNumber: string; company: string; status: RfqStatus; createdAt: string }[];
  };
  products: { active: number; archived: number; featured: number };
  categories: { active: number };
  contacts: { new: number };
  activity: { id: string; action: string; summary: string; entityType: string; createdAt: string; actor: { name: string } | null }[];
}
