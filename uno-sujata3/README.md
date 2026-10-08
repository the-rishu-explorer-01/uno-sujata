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
npm test                      # unit tests: search, filters, URL state, file validation, RFQ rules
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

## Request for quotation (RFQ)

### Journey
Product page → "Request a Quote" (pre-fills product, part number and category) → form → drawings uploaded and checked one at a time → submit → RFQ reference shown on the success page → confirmation email to the customer and notification to the internal inbox.

### Routes
| Path | Purpose |
| --- | --- |
| `/request-quote` | Form. Accepts `?product=<slug>` and `&type=drawing`. |
| `/request-quote/success` | Confirmation with the RFQ reference. Reads it from navigation state, not the URL. |

### API
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/rfq/uploads` | Multipart, one file, field name `file`. Returns a staged file `id`. Rate limited. |
| DELETE | `/api/rfq/uploads/:id` | Removes a staged file the customer no longer wants. |
| POST | `/api/rfq` | JSON submission. Send `Idempotency-Key` (16–64 characters). Returns `rfqNumber`, `status`, `submittedAt`, and a one-time `accessToken`. |
| GET | `/api/rfq/:rfqNumber` | Customer-safe status. Requires header `X-RFQ-Token`. Returns only the number, a status label, the submission date and product names. Wrong or unknown references return the same response. |

### RFQ numbers
`RFQ-SUJ-2026-00001`. Generated on the server inside the same transaction that creates the RFQ, using an atomic per-year counter (`RfqCounter`). A rolled-back submission does not consume a number. The year is UTC.

### Uploads
1. The browser checks the extension, size, count and first bytes. This is for speed only.
2. The server repeats every check: allowlisted extension, size limit, file signature (magic bytes), and blocked executable and script content, whatever the extension says.
3. The file is stored under a random name, outside any public directory, with owner-only permissions. Its name is sanitised. Its MIME type is set by the server, not the client.
4. Staged files expire after 24 hours and are removed by an hourly job. Only files attached on submission become part of the RFQ.

Allowed: PDF, STEP (.step, .stp), DWG, DXF, JPG, PNG. Up to 5 files, 10 MB each (`MAX_UPLOAD_MB`).

### Security
- Server-side validation of every field (zod). Client validation is advisory.
- HTML tags are stripped from free text. Line breaks are removed from single-line fields, so values cannot inject email headers.
- Honeypot field (`website`) rejects automated form fills.
- Rate limits per IP: submissions, uploads and lookups (`RFQ_SUBMIT_LIMIT`, `RFQ_UPLOAD_LIMIT`, `RFQ_LOOKUP_LIMIT`). Set `TRUST_PROXY` behind a reverse proxy so the real client IP is used.
- CORS allowlist from `CORS_ORIGIN`. In production with no list set, cross-origin requests are refused.
- Lookup tokens are 192-bit random values. Only their SHA-256 hash is stored. Comparison is constant-time.
- Idempotency keys stop a retried or double-clicked submission creating two RFQs.
- Errors never include stack traces. 5xx responses use a generic message, and details go to the server log.

### Email
An abstraction in `server/src/services/email/`. Choose the transport with `EMAIL_PROVIDER`:
- `console` (default): prints emails to the server log. Use for development only.
- `smtp`: sends through `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, with `MAIL_FROM`.

Customer confirmation: "Your requirement has been received." with the RFQ number. Internal notification: "New RFQ received." sent to `RFQ_NOTIFY_EMAIL`, with the customer as reply-to. Email failures are logged and do not fail the submission, because the RFQ is already saved. The database does not yet record whether each email was delivered.

### Database
- `RFQ`: the enquiry, with `status` (`NEW`, `UNDER_REVIEW`, `TECHNICAL_REVIEW`, `QUOTE_PREPARED`, `CLOSED`).
- `RFQAttachment`: drawings attached to an RFQ. Cascade-deleted with the RFQ.
- `RFQProduct`: products linked to an RFQ. Names and codes are copied, so the record survives catalogue changes.
- `PendingUpload`: staged files awaiting submission.
- `RfqCounter`: per-year sequence.

In Prisma Client the models are accessed as `prisma.rFQ`, `prisma.rFQAttachment` and `prisma.rFQProduct`, following Prisma's naming rules.

Migration note: the earlier `QuoteRequest` table and the `/api/quote-requests` endpoint are removed. There is no production data to migrate yet.

### Open items for the RFQ system
1. Email delivery is not recorded on the RFQ. Add `customerEmailSentAt` and `internalEmailSentAt` before go-live.
2. Attachment files are not deleted when an RFQ is deleted (the rows are). Add a cleanup job.
3. No virus scanning. Add ClamAV or a managed scanner before accepting files from the public.
4. No internal interface for changing status yet. The statuses exist; a back office or admin route should set them.
5. The customer status lookup has no UI. The token is returned once to API clients. Decide whether to email a status link or build a customer portal.
6. The sales inbox address (`RFQ_NOTIFY_EMAIL`) must be supplied by the client.
7. `Industry`, `Material` and `Application` inputs accept free text. Suggestions come from the catalogue lists, but nothing forces a choice.
8. Customer privacy consent wording needs legal review.

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
  src/lib/files.ts, rfqSchema.ts   upload policy and submission validation (unit tested)
  src/services/rfq.service.ts      RFQ creation, uploads, status lookup
  src/services/email/              email abstraction and templates
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

**Not yet run.** This code was written in a sandbox without package registry access, so nothing has been installed, compiled, built or run in a browser. What was checked:

- All local imports resolve, and named imports exist in the modules they come from (static script).
- No remaining references to the removed quote endpoint.
- Brackets balance in every source file.
- Unit tests are written for: file signature and extension rules, filename sanitising, text sanitising, the RFQ submission schema, RFQ numbering, access tokens, the client form schema and client file rules.

Before release, run in order and fix whatever fails:

1. `npm install`
2. `npm run db:generate` and `npm run db:migrate` (migration name e.g. `rfq`)
3. `npm run db:seed`
4. `npm test`
5. `npm run typecheck`, `npx tsc -p server/tsconfig.json --noEmit`, `npm run lint`
6. `npm run build`
7. Browser tests:
   - normal submission, then confirm the RFQ number is sequential and the success page shows it
   - invalid email and missing fields (inline errors, nothing sent)
   - a file over 10 MB, a `.exe` renamed to `.pdf`, and a valid PDF with a wrong extension
   - five files, then a sixth (should be refused)
   - a product-specific RFQ from a product page (product, part number and category pre-filled, and editable)
   - a mobile upload at 360 px and 390 px
   - API stopped mid-submit (network banner, then retry with the same key creates one RFQ only)
   - double-click on submit (one RFQ only)
   - server error (generic message, no stack trace)
