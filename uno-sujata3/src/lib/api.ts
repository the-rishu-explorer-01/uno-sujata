import type {
  Capability,
  FilterOption,
  Industry,
  Paged,
  ProductCategory,
  ProductDetail,
  ProductQuery,
  ProductSummary,
} from "@/types/catalog";
import { categories as seedCategories, products as seedProducts } from "@/data/products";
import { capabilities as seedCapabilities, industries as seedIndustries } from "@/data/content";
export class ApiError extends Error {
  status: number;
  /** Stable machine code from the server (e.g. VALIDATION_ERROR). Never shown to customers. */
  code?: string;
  /** Field-level validation messages, keyed by field name. */
  fields?: Record<string, string[]>;
  constructor(status: number, message: string, code?: string, fields?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** Reads the server's error body into an ApiError. Falls back to a generic message if the body is not JSON. */
async function toApiError(res: Response): Promise<ApiError> {
  let message = "Something went wrong. Please try again.";
  let code: string | undefined;
  let fields: Record<string, string[]> | undefined;
  try {
    const body = (await res.json()) as { error?: string; code?: string; details?: Record<string, string[]> };
    if (body.error) message = body.error;
    code = body.code;
    fields = body.details && typeof body.details === "object" && !Array.isArray(body.details) ? body.details : undefined;
  } catch {
    /* not JSON: keep the generic message */
  }
  return new ApiError(res.status, message, code, fields);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

/** For homepage content only: falls back to bundled data if the API is down. */
async function withFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    return await request<T>(path);
  } catch {
    return fallback;
  }
}

/** Builds the query string for GET /api/products. Empty values are omitted. */
export function productQueryString(q: Partial<ProductQuery>): string {
  const p = new URLSearchParams();
  if (q.search?.trim()) p.set("search", q.search.trim());
  if (q.category) p.set("category", q.category);
  q.material?.forEach((v) => p.append("material", v));
  q.application?.forEach((v) => p.append("application", v));
  q.process?.forEach((v) => p.append("process", v));
  q.type?.forEach((v) => p.append("type", v));
  if (q.page && q.page > 1) p.set("page", String(q.page));
  if (q.limit) p.set("limit", String(q.limit));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export interface StagedFile {
  id: string;
  name: string;
  extension: string;
  sizeBytes: number;
}

export interface RfqPayload {
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  industry?: string;
  productSlugs: string[];
  partNumber?: string;
  quantity?: string;
  material?: string;
  finish?: string;
  application?: string;
  deliveryRequirement?: string;
  message: string;
  attachmentIds: string[];
  consent: true;
  website?: string;
}

export interface SubmitRfqResponse {
  rfqNumber: string;
  status: string;
  submittedAt: string;
}

/** Random idempotency key. Uses getRandomValues so it works on non-HTTPS origins, unlike randomUUID. */
export function newIdempotencyKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const api = {
  // Catalogue (errors surface to the UI)
  products: (q: Partial<ProductQuery>, signal?: AbortSignal) =>
    request<Paged<ProductSummary>>(`/products${productQueryString(q)}`, { signal }),
  productBySlug: (slug: string, signal?: AbortSignal) =>
    request<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { signal }),
  categories: (signal?: AbortSignal) => request<ProductCategory[]>("/categories", { signal }),
  materials: (signal?: AbortSignal) => request<FilterOption[]>("/materials", { signal }),
  applications: (signal?: AbortSignal) => request<FilterOption[]>("/applications", { signal }),
  processes: (signal?: AbortSignal) => request<FilterOption[]>("/processes", { signal }),
  facets: (signal?: AbortSignal) =>
    request<{ materials: FilterOption[]; applications: FilterOption[]; processes: FilterOption[]; types: FilterOption[] }>(
      "/facets",
      { signal }
    ),

  // Homepage content (fallback to bundled data)
  homeCategories: () =>
    withFallback<ProductCategory[]>(
      "/categories",
      seedCategories.map((c) => ({ ...c, productCount: seedProducts.filter((p) => p.categorySlug === c.slug).length }))
    ),
  industries: () => withFallback<Industry[]>("/industries", seedIndustries),
  capabilities: () => withFallback<Capability[]>("/capabilities", seedCapabilities),

  /** Uploads one drawing with real progress. Resolves with the staged file's id. */
  uploadDrawing: (file: File, onProgress: (fraction: number) => void, signal?: AbortSignal) =>
    new Promise<StagedFile>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("file", file);
      xhr.open("POST", "/api/rfq/uploads");
      xhr.setRequestHeader("Accept", "application/json");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        let body: unknown = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          /* not JSON */
        }
        if (xhr.status === 201 && body) {
          resolve(body as StagedFile);
          return;
        }
        const b = (body ?? {}) as { error?: string; code?: string };
        reject(new ApiError(xhr.status, b.error ?? "Upload failed. Please try again.", b.code));
      };
      xhr.onerror = () => reject(new ApiError(0, "Network error", "NETWORK"));
      xhr.onabort = () => reject(new ApiError(0, "Upload cancelled", "CANCELLED"));
      signal?.addEventListener("abort", () => xhr.abort());
      xhr.send(form);
    }),

  discardDrawing: (id: string) => fetch(`/api/rfq/uploads/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => undefined),

  /** Submits the enquiry. The Idempotency-Key lets a retry after a network failure return the same RFQ. */
  submitRfq: (payload: RfqPayload, idempotencyKey: string) =>
    request<SubmitRfqResponse>("/rfq", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    }),
};
