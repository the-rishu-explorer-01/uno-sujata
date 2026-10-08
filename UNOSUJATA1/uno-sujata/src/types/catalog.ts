export interface ProductCategory {
  slug: string;
  name: string;
  summary: string;
}

export interface Product {
  slug: string;
  name: string;
  categorySlug: string;
}

export interface Industry {
  slug: string;
  name: string;
  summary: string;
}

export interface Capability {
  slug: string;
  title: string;
  description: string;
}

export interface CompanyFact {
  value: string;
  label: string;
}
