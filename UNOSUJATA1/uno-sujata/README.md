# UNO SUJATA Website

Frontend (React, Vite, TypeScript, Tailwind, Framer Motion) and API (Express, Prisma, PostgreSQL).

## Setup

Requires Node 20+ and PostgreSQL 14+.

```bash
npm install
cp .env.example .env          # set DATABASE_URL
npm run db:generate           # generate the Prisma client
npm run db:migrate            # create tables (name the migration, e.g. "init")
npm run db:seed               # load categories, products, industries, capabilities
```

## Run

Two terminals:

```bash
npm run server:dev            # API on http://localhost:4000
npm run dev                   # site on http://localhost:5173 (proxies /api)
```

The site still renders if the API is down. It falls back to the bundled data in `src/data/`.

## Build and checks

```bash
npm run typecheck
npm run lint
npm run build
npm run preview
```

Also run `npx tsc -p server/tsconfig.json --noEmit` to type-check the server.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| GET | `/api/categories` | Product categories |
| GET | `/api/products` | Optional `?category=<slug>` filter |
| GET | `/api/products/:slug` | 404 if unknown or unpublished |
| GET | `/api/industries` | |
| GET | `/api/capabilities` | |
| POST | `/api/quote-requests` | Validated; returns a `reference` |

## Structure

```
src/
  data/        company facts, product categories, industries, capabilities (source of truth for the UI)
  sections/    homepage sections
  components/  header, footer, drawer, SEO helper
  pages/       home, request quote, 404
  lib/         API client with fallback, Zod schemas
server/
  src/         Express app, routes, controllers, services, middleware, utils
  prisma/      schema and seed
```

## Before launch: open items

These are not yet confirmed. Do not publish until each is resolved.

1. **Routes not built yet:** `/products`, `/about`, `/quality`, `/privacy`, `/terms`, `/cookies`. Links to them currently 404.
2. **Domain:** `https://www.unosujata.com` is a placeholder in `index.html`, `Seo.tsx`, and `public/sitemap.xml`. Replace it with the real domain.
3. **Copy to confirm with the client:** the manufacturing journey steps, the quality check descriptions (especially "Inspection records available on request" and "Lots tracked from material to dispatch"), the response-time wording, and the claim "India's third largest exporter" (the company's own statement, shown with attribution).
4. **Industries:** Energy, Appliances, and Hardware from the brief were left out because the source site does not show them.
5. **Year count:** the source site says "after 42 years" and "after 32 years" in different places. The site avoids year-count claims for this reason.
6. **Certifications:** none are listed. Add only verified certifications.
7. **Imagery:** the hero uses an SVG technical drawing placeholder. Replace it with approved macro and facility photography.
8. **Logo:** the wordmark is a placeholder. Replace it with the approved logo.
9. **Search:** the header search button is not wired up.
10. **SEO:** meta tags are set in the browser. Crawlers that do not run JavaScript see only the static `index.html` values. Add prerendering or SSR before relying on per-page SEO.
11. **Quote notifications:** `quote.service.ts` stores requests but does not email anyone yet.

## Verification status

This code was written in a sandbox without package registry access. It has not yet been installed, type-checked, linted, built, or run in a browser. The first `npm install` and `npm run build` will likely surface a few TypeScript or lint errors that need fixing. Responsive checks at 360, 390, 430, 768, 1024, 1280, 1440, and 1920px are still to do.
