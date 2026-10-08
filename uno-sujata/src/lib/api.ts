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
import type { QuoteRequest } from "@/lib/schemas";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* body was not JSON */
    }
    throw new ApiError(res.status, message);
  }
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

  submitQuote: (payload: QuoteRequest) =>
    request<{ ok: boolean; reference?: string }>("/quote-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};
