# UNO SUJATA Website

Frontend: React, Vite, TypeScript, Tailwind, Framer Motion.
API: Express, Prisma, PostgreSQL.

## Setup

Requires Node 20+ and PostgreSQL 14+.

```bash
npm install
cp .env.example .env          # set DATABASE_URL
npm run db:generate           # generate the Prisma client
npm run db:migrate            # create tables (name the migration, e.g. "catalogue")
npm run db:seed               # load categories, products, lookups, industries, capabilities
```

## Run

```bash
npm run server:dev            # API on http://localhost:4000
npm run dev                   # site on http://localhost:5173 (proxies /api and /sitemap.xml)
```

## Checks

```bash
npm run typecheck             # frontend
npx tsc -p server/tsconfig.json --noEmit   # server
npm run lint
npm test                      # unit tests: search tokenising, filter logic, URL state
npm run build                 # production build; must pass before release
```

## Catalogue system

### Routes
| Path | Purpose |
| --- | --- |
| `/products` | All products, search, filters, pagination |
| `/products/category/:slug` | Category page with the same search and filters |
| `/products/:slug` | Product detail: spec table, images, related products, quote CTAs |
| `/request-quote?product=:slug` | Quote form, pre-filled with the product |
| `/request-quote?product=:slug&type=drawing` | Drawing submission |

### URL state
Search and filters live in the URL (`?search=`, `material=`, `application=`, `process=`, `type=`, `page=`). Filtered views can be shared, and the back button works. Changing any filter resets to page 1. The canonical URL for a category or the catalogue always points to the base page, so filtered views do not compete with it in search.

### API
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/products` | `search`, `category`, `material`, `application`, `process`, `type`, `page`, `limit` (max 48, default 12). Repeat a param or use commas for several values. |
| GET | `/api/products/:slug` | Includes spec fields, images and up to 4 related products. 404 if unknown or unpublished. |
| GET | `/api/categories` | Includes `productCount` |
| GET | `/api/materials` | |
| GET | `/api/applications` | |
| GET | `/api/processes` | |
| GET | `/api/facets` | Filter options with live counts (drives the sidebar) |
| POST | `/api/quote-requests` | Validated. Accepts optional `productSlug`. Returns a `reference`. |
| GET | `/sitemap.xml` | Generated from the database: static pages, categories and published products |

### Search behaviour
Each word in the query must match at least one of: product name, part number, product type, description, category, material, application or process. Words are matched case-insensitively. Singular and plural forms match each other ("pins" finds "pin"). For example, "brass pin" returns brass products whose name or type includes "pin". Results are ordered by name. There is no relevance ranking yet.

### Data provenance
- Category and product names come from sujatabrass.com.
- Materials, applications, processes and product types are **derived** from those names. They are not confirmed specifications.
- Every product is `verified: false`. Product codes are null. Finishes are empty. Unknown values show "Available on request".
- Dimensions show "As per drawing" on every product. This is the company's standard practice, not a measured value.
- Marketplace listings from other companies were deliberately not used as a source.

## Structure

```
src/
  data/        catalogue seed (products, categories, lookups), company facts, content
  hooks/       debounced value, cancellable product list fetch
  lib/         API client, URL query helpers, Zod schemas
  components/catalog/   search, filter panel and drawer, active chips, cards, pagination, states, spec table
  pages/       products list, product detail, quote, 404
  sections/    homepage sections
server/
  src/services/productFilters.ts   pure search and filter logic (unit tested)
  src/services/product.service.ts  database queries
  src/routes/sitemap.ts            dynamic sitemap
  prisma/schema.prisma             catalogue, lookups, images, quote requests
  prisma/seed.ts                   loads src/data into the database
```

## Data model

- `ProductCategory` one-to-many `Product`
- `Product` many-to-many `Material`, `Application`, `ManufacturingProcess`
- `Product` one-to-many `ProductImage` (cascade delete)
- `QuoteRequest` optionally references a product by slug

## Before launch: open items

1. **Confirm technical data with the client, product by product.** Materials, processes and applications are derived. Set `verified: true` once confirmed.
2. **Product codes:** supply real part numbers. Search matches them.
3. **Images:** no product photography exists yet. Each product currently shows a placeholder. Upload real images through `ProductImage`.
4. **Image optimisation:** images are served at their original size with lazy loading and fixed dimensions to prevent layout shift. Add a CDN or resize pipeline (WebP, responsive `srcset`) before launch.
5. **Routes still missing:** `/about`, `/quality`, `/privacy`, `/terms`, `/cookies`.
6. **Domain:** `https://www.unosujata.com` is a placeholder. Replace it in `index.html`, `src/components/Seo.tsx`, `server/src/routes/sitemap.ts` (or set `PUBLIC_SITE_URL`).
7. **Filter counts are global**, not recalculated for the current search. Making them contextual is a possible enhancement.
8. **Search ranking:** results are alphabetical. Relevance ranking (name matches first) would need a search index such as PostgreSQL full-text search.
9. **Quote notifications:** requests are stored but no email is sent yet.
10. **SEO for crawlers that don't run JavaScript:** per-product meta tags are set in the browser. Add prerendering or server rendering before relying on them.
11. **Copy to confirm:** the journey steps, quality check descriptions and response-time wording on the homepage (carried over from earlier).

## Verification status

This code has not been installed, compiled, run or tested in a browser. The sandbox used to write it has no package registry access. Static checks passed (all local imports resolve, and named imports exist). Before release, run every command in the Checks section and test in a browser:

- search (debounce, loading, empty, error, plural, multi-word)
- each filter, removing individual chips, and Clear all
- pagination, and the URL after page changes
- product detail for a valid slug, an unknown slug, and an API that is down
- mobile filter drawer (open, Escape, close, results count)
- responsive widths 360, 390, 430, 768, 1024, 1280, 1440, 1920 px
- the `npm run build` output
