import type { Capability, Industry, Product, ProductCategory } from "@/types/catalog";
import { categories, products } from "@/data/products";
import { capabilities, industries } from "@/data/content";
import type { QuoteRequest } from "@/lib/schemas";

/**
 * Reads from the API when it is running; falls back to bundled data so the
 * site still renders if the backend or database is down.
 */
async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`/api${path}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const api = {
  categories: () => getJson<ProductCategory[]>("/categories", categories),
  products: () => getJson<Product[]>("/products", products),
  industries: () => getJson<Industry[]>("/industries", industries),
  capabilities: () => getJson<Capability[]>("/capabilities", capabilities),
  submitQuote: async (payload: QuoteRequest): Promise<{ ok: boolean; reference?: string }> => {
    const res = await fetch("/api/quote-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Submission failed");
    return res.json();
  },
};
