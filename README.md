# Career Reads

A fast, SEO-focused editorial blog built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS 4**, **Motion (Framer Motion)**, and **MDX**. It publishes practical articles on technology, AI tools, productivity, travel, lifestyle, and personal development, and is prepared for **Google AdSense** monetization.

- Server Components by default; client JavaScript only for the theme toggle, mobile menu, forms, copy-link, scroll reveals, and ad units.
- Static generation with hourly ISR (`revalidate = 3600`) for every content page.
- A storage-agnostic content layer: MDX files, or the Career Reads API (managed in the admin panel), without touching pages.

> **Before you launch:** the bundled articles are original *demo content*. Review, rewrite, or replace them with your own expertise before applying for AdSense, and add real author profiles. AdSense approval and search rankings are never guaranteed.

---

## Contents

1. [Quick start](#quick-start)
2. [Scripts](#scripts)
3. [Project structure](#project-structure)
4. [Publishing articles](#publishing-articles)
5. [Environment variables](#environment-variables)
6. [Deploying to Vercel](#deploying-to-vercel)
7. [Custom domain](#custom-domain)
8. [SEO setup](#seo-setup)
9. [Google Search Console](#google-search-console)
10. [Google Analytics](#google-analytics)
11. [Google AdSense](#google-adsense)
12. [Forms: contact & newsletter](#forms-contact--newsletter)
13. [Testing](#testing)
14. [Performance & accessibility](#performance--accessibility)
15. [Content from the API / admin dashboard](#content-from-the-api--admin-dashboard)

---

## Quick start

Requirements: **Node.js ≥ 20.9** (22 LTS recommended) and npm.

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Open http://localhost:3000. Everything works with an empty `.env.local`: analytics and ads stay off, and form submissions are logged to the terminal in development.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit + content-integrity tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) against a production build |
| `npm run check` | lint → typecheck → unit tests → build (use in CI) |
| `npm run content:new -- "Title" --category ai` | Scaffold a new draft article + cover art |
| `npm run content:check` | Validate all articles (frontmatter, authors, covers, internal links) |
| `npm run covers` | Generate SVG cover art for articles missing one (`-- --force` to redo all) |
| `npm run brand` | Re-render PNG icons/logo from `public/brand/blognest-mark.svg` |

First time running e2e tests: `npx playwright install chromium`.

## Project structure

```
content/
  articles/*.mdx          ← one file per article; file name = URL slug
  authors/*.json          ← author profiles (validated with Zod)
  jobs/*.json             ← one file per job; file name = URL slug (/jobs/<slug>)
public/
  brand/                  ← logo mark (SVG) and app icons
  images/covers/          ← article cover images
  logo.png                ← Organization logo for structured data
scripts/                  ← new-article, cover generator, brand assets
src/
  app/                    ← routes (App Router)
    blog/[slug]/          ← article pages + dynamic Open Graph images
    blog/page/[page]/     ← paginated archive (/blog/page/2 …)
    category/[category]/  ← category pages (+ /page/[page])
    latest/ trending/ search/ authors/[slug]/
    about/ contact/ privacy-policy/ terms/ editorial-policy/
    corrections-policy/ advertising-disclosure/
    jobs/ jobs/[slug]/    ← job listings with filters + job detail pages
    rss.xml/ ads.txt/     ← route handlers
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx
    actions.ts            ← Server Actions (contact, newsletter)
  components/
    ads/                  ← AdSlot (server) + AdUnit (client)
    analytics/            ← Google Analytics + Consent Mode defaults
    article/              ← cards, grid, TOC, MDX renderer, share, author box
    forms/  home/  layout/  seo/  ui/
  lib/
    content/              ← schema, repository interface, MDX repository, search, pagination
    forms/                ← Zod schemas, rate limiter, delivery integrations
    env.ts                ← validated environment config
    seo.ts jsonld.ts ads.ts site.ts categories.ts
tests/
  unit/                   ← Vitest
  e2e/                    ← Playwright
docs/                     ← AdSense, publishing, and content-source guides
```

## Publishing articles

The full workflow is in **[docs/PUBLISHING.md](docs/PUBLISHING.md)**. In short:

1. `npm run content:new -- "How to Back Up Your Photos" --category technology` creates `content/articles/how-to-back-up-your-photos.mdx` with `status: draft` and a generated cover.
2. Write the article. Preview drafts locally with `CONTENT_PREVIEW_DRAFTS=true npm run dev`.
3. `npm run content:check` validates frontmatter, authors, covers, internal links, and leftover TODOs.
4. Set `status: published`, commit, and push. Vercel rebuilds and the article is live.

**Draft safety:** drafts are filtered out in one place (`isPubliclyVisible` in `src/lib/content/visibility.ts`). They never appear in pages, listings, search, the sitemap, or RSS in production, even if `CONTENT_PREVIEW_DRAFTS` is set. Articles with a future `publishedAt` stay hidden until that date (and appear within the hourly revalidation window).

**Trending and featured** are editorial flags in frontmatter (`trending`, `featured`, `editorsPick`). The site labels trending as *editor-curated*; it never claims traffic-based rankings.

## Environment variables

All variables are documented in **[.env.example](.env.example)** and validated at startup by `src/lib/env.ts` (bad values fail the build with a clear message).

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | **Yes in production** | Canonical origin, e.g. `https://www.blognest.com` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Recommended | Public contact address |
| `GOOGLE_SITE_VERIFICATION` | Optional | Search Console HTML-tag token |
| `BING_SITE_VERIFICATION` | Optional | Bing Webmaster Tools token |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | GA4 ID (`G-…`) |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Optional | AdSense publisher ID (`ca-pub-…`) |
| `NEXT_PUBLIC_ADS_ENABLED` | Optional | Master switch for ads (default `false`) |
| `NEXT_PUBLIC_ADSENSE_SLOT_*` | Optional | Ad unit IDs per placement |
| `NEXT_PUBLIC_ADS_SHOW_PLACEHOLDERS` | Dev only | Show dashed boxes where ads go |
| `CONTENT_PREVIEW_DRAFTS` | Dev only | Render drafts locally |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Optional | Contact form delivery |
| `NEWSLETTER_WEBHOOK_URL`, `NEWSLETTER_WEBHOOK_SECRET` | Optional | Newsletter signups |
| `API_URL` | Optional | The Career Reads API (`blognest-api`), e.g. `http://localhost:4000`. When set, articles, authors, jobs, categories and settings come from it; otherwise from `content/` |
| `SITE_API_KEY` | With `API_URL` | Sent as `X-Api-Key`; same value as `SITE_API_KEY` in the API. Needed for the contact form, newsletter, page counters and draft previews |
| `REVALIDATE_SECRET` | With `API_URL` | Shared secret the API uses to call `/api/revalidate` after saves |

`NEXT_PUBLIC_*` values are inlined at **build time** — redeploy after changing them. Never put secrets in `NEXT_PUBLIC_*` variables.

## Deploying to Vercel

1. Push this project to GitHub, GitLab, or Bitbucket.
2. In Vercel, **Add New → Project** and import the repository. The framework preset (Next.js) is detected automatically; no `vercel.json` is needed.
3. Add environment variables (at minimum `NEXT_PUBLIC_SITE_URL` set to your final domain) for the **Production** environment.
4. Deploy. Every push to the main branch redeploys; pull requests get preview URLs.

**Preview deployments are not indexed:** `robots.txt` disallows everything when `VERCEL_ENV=preview`.

Self-hosting also works: `npm run build && npm start` behind a reverse proxy (Node.js ≥ 20.9).

## Custom domain

1. Vercel → Project → **Settings → Domains** → add `blognest.com` and `www.blognest.com` (your domain).
2. At your DNS provider, add the records Vercel shows (an `A` record for the apex and a `CNAME` for `www`).
3. Choose one canonical host (for example `www`) and set the other to redirect to it in Vercel's domain settings.
4. Set `NEXT_PUBLIC_SITE_URL` to exactly that canonical origin (`https://www.blognest.com`, no trailing slash) and redeploy. Canonical URLs, sitemap, RSS, Open Graph and JSON-LD all derive from it.

HTTPS certificates are issued automatically.

## SEO setup

What's built in:

- **Unique titles and descriptions** for every indexable page (`buildMetadata` in `src/lib/seo.ts`; article overrides via `seoTitle` / `seoDescription`).
- **Self-referencing canonical URLs** on every page; articles support `canonicalUrl` when content was first published elsewhere.
- **Open Graph & Twitter cards**, including generated 1200×630 images per article (`/blog/[slug]/opengraph-image`).
- **JSON-LD**: `Organization`, `WebSite` (site-wide), `BlogPosting` (articles), `BreadcrumbList`, `CollectionPage` (listings), `ProfilePage` (authors).
- **`/sitemap.xml`** with only canonical, published, indexable URLs and `lastModified` dates; **`/robots.txt`** pointing to it.
- **`/rss.xml`** with the 30 most recent articles.
- **Indexing controls**: drafts are 404 in production; `/search` is `noindex, follow`; empty categories are `noindex`; `noindex: true` in frontmatter excludes an article; `/api/*` sends `X-Robots-Tag: noindex`.
- **Duplicate URL prevention**: `/blog/page/1` and `/category/x/page/1` 301-redirect to the base URL; invalid page numbers return 404.
- **Semantic HTML**: one `<h1>` per page, ordered headings, landmarks, breadcrumbs, `<time>` elements.
- **Internal linking**: related articles, category/tag links, breadcrumbs, and contextual links inside articles.
- **Images**: `next/image` with explicit dimensions or reserved aspect ratios, descriptive `alt` text, lazy loading below the fold, and `priority` for the LCP image.

Good practice from here: write for people first, keep articles accurate and updated, and avoid publishing thin or mass-produced pages. Rankings depend on many factors and are never guaranteed.

## Google Search Console

1. Go to https://search.google.com/search-console and **Add property**.
2. **Recommended — Domain property:** verify with a DNS TXT record at your DNS provider. This covers all subdomains and protocols.
3. **Alternatively — URL-prefix property:** choose *HTML tag*, copy only the `content` value, set `GOOGLE_SITE_VERIFICATION` in Vercel, redeploy, and click **Verify**.
4. In **Sitemaps**, submit `https://your-domain.com/sitemap.xml`.
5. Use **URL Inspection** on a few articles to request indexing, and monitor **Pages** and **Core Web Vitals** reports.

## Google Analytics

1. Create a GA4 property at https://analytics.google.com → **Admin → Data streams → Web**.
2. Copy the Measurement ID (`G-XXXXXXXXXX`) into `NEXT_PUBLIC_GA_MEASUREMENT_ID` and redeploy.
3. GA loads only in production builds via `next/script` (`afterInteractive`), with **Consent Mode v2** defaults: analytics and ad storage are *denied* in the EEA, UK and Switzerland until a consent tool grants them, and granted elsewhere. Review these defaults with your legal adviser (`src/components/analytics/GoogleAnalytics.tsx`).
4. For EEA/UK/CH visitors, enable a Google-certified consent management platform (CMP). The simplest option is AdSense/Funding Choices **Privacy & messaging** (see [docs/ADSENSE.md](docs/ADSENSE.md)), which updates Consent Mode automatically.

## Google AdSense

Full guide: **[docs/ADSENSE.md](docs/ADSENSE.md)** (eligibility checklist, applying, ads.txt, creating ad units, consent, and policy-safe placement).

How the integration works:

- **`<AdSlot placement="…" />`** (`src/components/ads/AdSlot.tsx`) is the only component pages use. Placements: `in-article`, `sidebar` (desktop only, sticky), `below-article`, `listing` (between listing rows).
- Ads render **only** when the build is production **and** `NEXT_PUBLIC_ADS_ENABLED=true` **and** `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set **and** that placement has a slot ID. Otherwise nothing renders (no empty boxes, no script).
- The official AdSense script is added to `<head>` only when ads are enabled.
- Each ad container reserves height (`min-h`) to limit layout shift, is labeled **“Advertisement”**, and sits in its own bordered block with generous spacing — never inside navigation, buttons, or cards.
- In-article ads are inserted automatically before an article's third `##` section, or wherever you put `<InArticleAd />`. Set `ads: false` in frontmatter to disable all ads on a sensitive article.
- **`/ads.txt`** is generated from `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (404 until set).
- Setting the client ID also adds the `google-adsense-account` meta tag, which AdSense can use to verify your site while ads are still disabled.
- Local development: set `NEXT_PUBLIC_ADS_SHOW_PLACEHOLDERS=true` to see dashed boxes where ads will appear.

## Forms: contact & newsletter

Both forms use Server Actions (`src/app/actions.ts`) with:

- **Zod validation** on the server (`src/lib/forms/schemas.ts`), with accessible field errors and input preserved on error.
- **Spam protection**: a hidden honeypot field, a minimum time-to-submit check, a link limit on messages, and per-IP rate limiting. Bots receive a generic success response and nothing is delivered.
- **Delivery boundaries** (`src/lib/forms/delivery.ts`):
  - Contact → [Resend](https://resend.com) when `RESEND_API_KEY` and `CONTACT_TO_EMAIL` are set. Verify your sending domain in Resend and set `CONTACT_FROM_EMAIL`.
  - Newsletter → JSON `POST` to `NEWSLETTER_WEBHOOK_URL` (`{ email, source, subscribedAt }`). Point it at your email provider's API, an automation tool, or your own endpoint. Use a provider with double opt-in where required.
  - Without configuration: development logs submissions; production shows an honest error (the contact form shows your email address).

The in-memory rate limiter is per server instance. On serverless platforms with heavy traffic, swap its store for a shared one such as Upstash Redis (`src/lib/forms/rate-limit.ts`).

## Testing

```bash
npm test
```

Unit tests (Vitest) cover search ranking, TOC extraction, ad injection, pagination, draft visibility, form schemas and spam timing, rate limiting, metadata, JSON-LD (including XSS escaping), components, and **every content file** (frontmatter, authors, covers, internal links, TODOs, uniqueness).

```bash
npm run test:e2e
```

End-to-end tests (Playwright) build and start the production server, then test navigation, pagination redirects, 404s, draft protection, search, theme persistence, forms, hydration/console errors, article metadata and structured data, sitemap/robots/RSS, unique titles/descriptions/canonicals across pages, mobile menu, and horizontal overflow on mobile.

## Performance & accessibility

- Static HTML + ISR; images via `next/image` (AVIF/WebP); fonts via `next/font` (self-hosted, `display: swap`).
- Above-the-fold hero animation is pure CSS (no JS dependency for LCP). Motion is loaded with `LazyMotion` + `domAnimation` and respects `prefers-reduced-motion`.
- Cover art is lightweight SVG; long-lived cache headers for `/images/*`.
- Skip link, visible focus styles, keyboard-operable menus (Escape closes, focus returns), labeled forms with `aria-invalid` / `aria-describedby`, `aria-current` on navigation, and text colors chosen for WCAG AA contrast in both themes.
- Theme toggle renders identical markup on server and client (no hydration mismatch, no flash).

## Content from the API / admin dashboard

See **[docs/DATABASE.md](docs/DATABASE.md)**. Pages depend only on the service layer in `src/lib/content/index.ts` and `src/lib/jobs/index.ts`. With `API_URL` set, content comes from the Career Reads API (edited in the admin panel); without it, from the files in `content/`. The website never connects to a database. Local start order: Postgres → API (:4000) → website (:3000) → admin (:3001).

## Jobs

Each job is a JSON file in `content/jobs/`, validated by `src/lib/jobs/schema.ts`. Jobs are hidden after their `deadline`. Files with `"sample": true` are examples that show only in development, never in production.

To manage jobs and posts from a web dashboard instead of files, follow `docs/ADMIN_PANEL_PLAN.md`.

