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

## Staff administration

Staff sign in at `/admin/login`. Everything under `/admin` is a separate shell from the public site and is never indexed.

### Setting up the first administrator
```bash
npm run db:migrate                                   # creates the admin tables (see Migrations)
ADMIN_EMAIL=you@company.example \
ADMIN_PASSWORD='a long passphrase of at least 12 characters' \
npm run admin:create
```
Clear the password from your shell history afterwards, or keep it in a secret manager. Further staff accounts are created by an administrator at Settings → Staff accounts.

### Screens
| Path | Who | Purpose |
| --- | --- | --- |
| `/admin` | staff | Dashboard: new and open RFQs, RFQs this week against last week, catalogue counts, RFQs by status, latest RFQs, recent activity |
| `/admin/rfqs` | staff | Search by RFQ number, company, name or email. Filter by status. Paginated. |
| `/admin/rfqs/:id` | staff | Customer, requirement, drawings (download), status change, history |
| `/admin/contacts` | staff | Contact form enquiries. Mark as handled. |
| `/admin/products` | staff | Search, filter by category and state. Archive and restore. |
| `/admin/products/new`, `/admin/products/:id` | editor, admin | Identity, category, material, application, process, specifications, finishes, publishing, images |
| `/admin/categories` | editor, admin | Create, edit, archive, restore, reorder |
| `/admin/industries`, `/admin/capabilities` | editor, admin | Create and edit |
| `/admin/content` | editor, admin | Hero, statistics, homepage sections, quality, about, contact details |
| `/admin/settings` | everyone | Change own password. Administrators also manage staff accounts and reset passwords. |

### Roles
| Permission | ADMIN | EDITOR |
| --- | --- | --- |
| View dashboard, RFQs, contacts, catalogue | yes | yes |
| Change RFQ status, download drawings | yes | yes |
| Manage products, categories, lookups, images | yes | yes |
| Manage industries, capabilities, content | yes | yes |
| Manage staff accounts, reset passwords | yes | no |
| Read audit trail | yes | yes |

The role map is in `server/src/lib/permissions.ts`. Adding a role means adding its permissions there. Routes do not change.

### Security model
- **Passwords** are hashed with scrypt (N=2^15) with a per-password salt. Plain passwords are never stored or logged. Minimum length 12.
- **Sessions** are random 256-bit tokens. Only their SHA-256 hash is stored. The cookie is HttpOnly, SameSite=Strict, and Secure in production. Sessions expire after 8 hours and are checked against the database on every request, so revocation takes effect immediately.
- **Sign-out and password change** revoke sessions server-side. A password change signs out every device. Deactivating or resetting an account does the same.
- **Brute force** is limited per IP (`ADMIN_LOGIN_LIMIT`, default 10 per 15 minutes) and per account (locked for 15 minutes after 5 failures). Unknown emails and locked accounts get the same message and the same response time as a wrong password.
- **CSRF**: state-changing requests must echo the `uno_csrf` cookie in the `X-CSRF-Token` header. A cross-site page cannot read the cookie, so it cannot send the matching header.
- **Authorisation** is checked on the server for every route, after authentication. The client hides controls the role cannot use, but that is cosmetic.
- **Input** is validated with zod on every route. Route ids must match a strict pattern. Unknown fields are ignored. The acting user always comes from the session, never from the request body.
- **Downloads**: each drawing is streamed with a nosniff header, a canonical content type, and `no-store`. Every download is written to the audit trail.
- **Audit trail** records sign-ins, failed sign-ins, status changes, product, category and content changes, downloads, and account changes. Audit writes for status changes are inside the same transaction as the change.
- **Safeguards**: the last active administrator cannot be demoted or disabled, and nobody can remove their own administrator access.
- **Public product images** live in `MEDIA_DIR`, served read-only at `/media`. Only JPG, PNG and WebP are accepted, identified by their bytes. Drawings are never in this directory.
- **Errors** return a generic message and a stable code. Details go to the server log.

### Content (CMS)
Each key is validated against its own schema and has a default. Defaults only use facts verified on the company website. The public read endpoint is `GET /api/content`. The homepage does not read it yet. Wiring it in is the next step, and the admin already writes the fields it will need.

| Key | Fields |
| --- | --- |
| `homepage.hero` | eyebrow, two headline lines, supporting text, two button labels |
| `homepage.stats` | up to six value and label pairs |
| `homepage.sections` | eight sections, each shown or hidden |
| `quality` | title, introduction |
| `about` | headline, story |
| `contact` | phone, email, address, opening hours (blank until confirmed) |

### Migrations
Run `npm run db:migrate` and name the migration (for example `admin`). This project had no `migrations/` folder before this change, because earlier sessions did not run migrate. The first migration therefore covers the whole schema, including the catalogue, RFQ and admin tables. Review the generated SQL before applying it to a shared database.

### Admin API
All routes are under `/api/admin`. Everything except `POST /auth/login` needs a session cookie, and state-changing methods also need `X-CSRF-Token`.

| Method | Path | Permission |
| --- | --- | --- |
| POST | `/auth/login` | none (rate limited) |
| POST | `/auth/logout`, POST `/auth/password`, GET `/auth/me`, GET `/auth/csrf` | any signed-in user |
| GET | `/dashboard` | dashboard:read |
| GET | `/rfqs`, GET `/rfqs/:id` | rfq:read |
| PATCH | `/rfqs/:id/status` | rfq:update |
| GET | `/rfqs/:id/attachments/:attachmentId` | rfq:download |
| GET, POST | `/products` | product:read, product:write |
| GET, PUT | `/products/:id` | product:read, product:write |
| POST | `/products/:id/archive`, `/restore` | product:write |
| POST, DELETE | `/products/:id/images`, `/images/:imageId` | product:write |
| GET | `/categories`, `/lookups` | product:read |
| POST, PUT | `/categories`, `/categories/:id`; POST `/categories/:id/archive`, `/restore`, `/categories/reorder` | category:write |
| GET, POST, PUT | `/industries`, `/capabilities` | content:read, content:write |
| GET, PUT | `/content`, `/content/:key` | content:read, content:write |
| GET | `/contacts`; POST `/contacts/:id/handled` | contact:read, contact:write |
| GET, POST, PATCH | `/users`, `/users/:id` | user:manage (administrators only) |
| GET | `/audit` | audit:read |

Public endpoints: `GET /api/content` and `POST /api/contact` (honeypot, rate limited).

### Archiving
Archiving a product hides it from the website and keeps it for records. Archiving a category is refused while it still has live products, so no public category is left empty or broken. Restoring a product under an archived category is refused until the category is restored.

## Corporate and manufacturing pages

| Path | Purpose | Data source |
| --- | --- | --- |
| `/industries` | Five sectors served, each linked | `src/data/pages.ts`, industry rows from the API |
| `/industries/:slug` | Requirement, typical components, capability, relevant live products, quote CTA, previous and next | `src/data/pages.ts`; products from `GET /api/products?application=` |
| `/capabilities` | Requirement through dispatch, in three stages, with a process diagram | `src/data/pages.ts` |
| `/quality` | Philosophy, six inspection stages, certifications from the CMS | `src/data/pages.ts`; CMS `quality` |
| `/about` | Story, statistics, timeline, Jamnagar, engineering focus, business approach, group | CMS `about`; `src/data/pages.ts`; `src/data/company.ts` |
| `/contact` | Company details, map placeholder, enquiry form to `POST /api/contact`, two CTAs | CMS `contact`; `src/data/company.ts` |

Every page has a unique title, meta description, canonical URL, Open Graph tags and structured data (`CollectionPage`, `WebPage`, `BreadcrumbList`, `AboutPage`, `ContactPage`, `Organization`). Animations fade in once on scroll. `MotionConfig reducedMotion="user"` turns off movement for people who ask for reduced motion.

### Industries
Five sectors, each backed by product categories on the company website: Electrical, Automotive, Gas Equipment, Fasteners & Hardware, Industrial Engineering. Industry slugs match the catalogue's application slugs, so the relevant products are real.

**Not published** (no supporting evidence on the company's own website): Electronics, Energy, Appliances, Hardware (as distinct from fasteners), Automation, Gas & Plumbing (plumbing). Add one only when the client confirms it, and add its content to `industryContent` in `src/data/pages.ts`. The test in `src/data/pages.test.ts` fails if an industry has no content.

**Industry rows and content must stay in step.** The test checks slugs match. If you rename an industry slug, change it in both places. The seed only creates and updates rows, and there is no admin delete for industries, so remove the old row directly in the database.

### Claims register

Facts from the company website, and what is still to confirm. Lines marked CONFIRM are process descriptions written from typical practice. The company website does not state them.

| Claim | Basis | Where |
| --- | --- | --- |
| Founded 1978, 200 sq. ft. start, Jamnagar | Company website | About, timeline |
| About 100,000 sq. ft. facility, about 120 workforce | Company website | About, statistics |
| Sujata Group with six other companies | Company website | About, timeline |
| Machine division builds sliding head, single spindle and rotary table machines | Company website (machine division page) | About, capabilities |
| "India's third largest exporter of brass and copper parts" | Company's own statement, shown with attribution | About |
| Each product made exactly to the print | Company website | Quality, capabilities |
| Measuring instruments used for dimensional checks | Company website navigation | Quality, capabilities |
| Non-ferrous turned components; forged and machined components | Company website product list | Capabilities, industries |
| Engineering review before quoting | CONFIRM | Capabilities, about |
| Material inspection, process inspection, final inspection | CONFIRM | Quality |
| Documentation and traceability | CONFIRM | Quality |
| Finishing, packaging, dispatch | CONFIRM | Capabilities |
| Opening hours | Not in the sources; left blank in CMS | Contact |

**Conflicting figures on third-party listings** were not used: a 1979 founding date, a 62,000 sq. ft. factory, 80 workers, and a 2003 registration. Those listings also describe a different legal entity. Confirm the official figures with the client.

### Certifications and placeholders
- **Certifications** are entered in the admin (Content → Quality). Each needs a name, issuing body, reference and validity date. Until one is added, the page says certifications will appear once verified. Nothing is shown by default.
- **Opening hours** on the contact page appear only once entered in the CMS.
- **Map**: a placeholder box with a link to Google Maps. No embedded map yet, to keep third-party scripts off the page.
- **Photography**: the pages use technical drawings. Replace them with approved factory photography when available.

### Route checks to run (in a browser)
Each route: loads, has one `h1`, title and description are unique, canonical is correct, no console errors.

1. `/`, `/products`, `/products/fuel-jets`, `/request-quote` (regression)
2. `/industries`, and each of its five links
3. `/industries/electrical`, `/industries/automotive`, `/industries/gas-equipment`, `/industries/hardware-fasteners`, `/industries/industrial`: relevant products load; "Request quote" links carry the product
4. `/industries/does-not-exist`: "Industry not found" page with `noindex`
5. `/capabilities`, `/quality`, `/about`, `/contact`
6. `/contact`: send an empty form (inline errors), a valid enquiry (success), and a second submission while the API is stopped (network message)
7. Quality page with and without a certification entered in the admin
8. Header and footer links on every public page, the mobile drawer at 360 px, and the Resources link opening the catalogue in a new tab
9. Animations with the operating system's "reduce motion" setting turned on: content visible without movement
10. Sitemap at `/sitemap.xml` lists every route above, plus each industry

### Open items for these pages
1. **Privacy, terms and cookie pages** are still linked from the footer and do not exist yet.
2. **CONFIRM lines** on the quality and capabilities pages need the client's sign-off, or rewording.
3. **Photography and the map** are placeholders.
4. **Industry content** is in code (`src/data/pages.ts`), not the CMS. Move it into the CMS if the client will edit it.
5. **Resources** links to the company catalogue only. Add a proper resources page when there is more to publish.

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
  src/services/auth.service.ts     sign-in, lockout, sessions, password change
  src/services/admin-*.service.ts  staff operations (RFQs, catalogue, content, users)
  src/middleware/auth.ts           session, CSRF and permission middleware
  src/lib/permissions.ts           role to permission map
  src/cli/create-admin.ts          first administrator
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

## Open items for staff administration
1. **Homepage content** is still static. Read `GET /api/content` into the sections and remove the hard-coded copy.
2. **Two-factor sign-in** is not implemented. Recommended before the admin is used from outside the office network.
3. **Session list and sign-out of other devices** are not shown to staff. The server supports revocation, but there is no screen for it yet.
4. **Lookup management**: materials, applications and processes can be assigned to products but not created or renamed in the admin.
5. **Lost access**: if every administrator is locked out, recovery needs a database-level change or re-running `admin:create` after removing the old account. Document the procedure with the client.
6. **Email on contact enquiries**: the contact form stores messages but does not notify anyone.
7. **Attachment deletion**: removing an RFQ does not yet delete its files.
8. **Rate-limit store** is in memory, so limits reset on restart and are per process. Use a shared store if the API runs on more than one instance.

## Verification status

**Not yet run.** This code was written in a sandbox without package registry access, so nothing has been installed, compiled, built or run in a browser. The corporate pages were added in this session. What was checked:

- All local imports resolve, and named imports exist in the modules they come from (static script).
- No remaining references to the removed quote endpoint.
- Brackets balance in every source file.
- Unit tests are written for: file signature and extension rules, filename sanitising, text sanitising, the RFQ submission schema, RFQ numbering, access tokens, the client form schema, client file rules, password hashing, role permissions, cookie parsing, image detection, slugs, admin input validation and CMS defaults.
- Unused imports and stray references were searched for and removed.
- Corporate page content has tests: every industry has content and catalogue links, and the timeline has one dated event (1978).
- Invalid list and block markup (a `<div>` or `<span>` directly inside a `<ul>` or `<ol>`) was found and fixed on the industry and about pages.

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
8. Admin tests, in a browser and with curl against the API:
   - sign-in with the right password, then with a wrong one (same message both times)
   - five wrong passwords in a row for one account (locked), and a correct one during the lock (refused)
   - an API call without the cookie (401), and with the cookie but without the CSRF header (403)
   - an EDITOR calling `/api/admin/users` (403), and the same call as ADMIN (200)
   - sign-out, then reusing the old cookie (401)
   - password change (all sessions ended, sign-in required again)
   - RFQ status change, then the history entry appears
   - drawing download (correct file name and type; an `X-Content-Type-Options: nosniff` header; a history entry)
   - product create, edit, archive and restore; an archived category refusing archive of live products
   - image upload of a renamed `.svg` or `.exe` (refused), and of a real JPG (accepted)
   - the admin layout at 768 px and 1024 px (sidebar opens as a drawer below 768 px; tables scroll sideways)
