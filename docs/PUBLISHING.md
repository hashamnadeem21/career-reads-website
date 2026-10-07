# Publishing workflow

Articles are MDX files in `content/articles/`. The file name is the URL slug (`content/articles/fix-slow-home-wifi.mdx` → `/blog/fix-slow-home-wifi`). Changing a file name changes the URL — add a redirect in `next.config.mjs` if you ever rename a published article.

## 1. Create a draft

```bash
npm run content:new -- "How to Back Up Your Photos" --category technology
```

This writes a draft with valid frontmatter and generates cover art. Categories: `technology`, `ai`, `lifestyle`, `productivity`, `travel`, `personal-development`.

## 2. Frontmatter reference

```yaml
title: "How to Back Up Your Photos"        # 10–110 chars, shown as the H1
excerpt: "One or two sentences…"            # 50–220 chars; cards, RSS, default meta description
category: technology                       # one of the six category slugs
tags: [backups, photos, cloud-storage]     # 1–8 lowercase tags; power search and related articles
author: editorial-team                     # slug of a file in content/authors/
publishedAt: 2026-10-05                    # future dates stay hidden until that day
updatedAt: 2026-11-01                      # optional; shows "Updated" and feeds dateModified
status: draft                              # draft | published
featured: false                            # homepage hero / featured slots
trending: false                            # editor-curated trending list
editorsPick: false                         # homepage editor's picks
coverImage: /images/covers/how-to-back-up-your-photos.svg   # the HERO image at the top of the article
coverAlt: "Describe the image for screen-reader users"
coverWidth: 1600                           # optional, defaults to 1600×900
coverHeight: 900
seoTitle: "Optional ≤ 70 chars"            # overrides <title>
seoDescription: "Optional 50–170 chars"    # overrides meta description
canonicalUrl: https://…                    # only if first published elsewhere
noindex: false                             # keep out of search engines and the sitemap
ads: true                                  # false disables all ads on this article
images:                                    # optional, up to 3 extra images inside the article
  - src: /images/articles/backup-3-2-1.webp
    alt: "Diagram of the 3-2-1 backup rule"  # 10–200 chars, required
    caption: "The 3-2-1 rule at a glance"    # optional
    placement: middle                      # where it appears (see below)
```

**Image placement:** each entry in `images` says where it goes, so you never edit the body to move a picture:

| `placement` | Where the image appears |
| --- | --- |
| `after-intro` | After the opening paragraphs, before the first `##` section |
| `middle` (default) | Directly under the heading of the middle `##` section |
| `before-conclusion` | Just before the last `##` section |
| `section:<heading-id>` | Directly under a specific `##`/`###` heading. The id is the heading's anchor, e.g. `## Why it matters` → `section:why-it-matters` |

An unknown `section:` id falls back to `middle`, and `npm run content:check` reports it. Put image files in `public/images/articles/`. `npm run covers` generates illustrated placeholders for any `/images/articles/<slug>-<n>.svg` that doesn't exist yet.

Invalid frontmatter fails `npm run content:check` and the build, with a message naming the file and field.

## 3. Write

Use `##` for main sections and `###` for subsections — they build the table of contents. Available MDX components:

```mdx
<Callout type="tip" title="Practical tip">One key takeaway.</Callout>      {/* type: info | tip | warning */}

<Figure src="/images/articles/backup-diagram.webp" alt="…" width={1600} height={900} caption="Optional caption" />

<InArticleAd />   {/* optional: choose where the in-article ad goes (default: before the 3rd ## section) */}

<Correction date="2026-11-02">An earlier version misstated the default storage limit.</Correction>
```

Link to other articles with root-relative links like `[time blocking](/blog/time-blocking-for-real-schedules)`; `content:check` fails on links to missing or unpublished articles. External links open in a new tab automatically.

**Images:** put files in `public/images/…`, prefer `.webp`/`.avif` around 1600px wide, and always write meaningful `alt` text. Use only images you have the rights to use.

## 4. Preview

```bash
CONTENT_PREVIEW_DRAFTS=true npm run dev
```

Drafts render with a "Draft preview" banner and `noindex`. This flag is ignored in production builds.

## 5. Quality checklist

- Original, accurate, and genuinely useful; facts checked against primary sources (see `/editorial-policy`).
- A clear excerpt and descriptive title — no clickbait or keyword stuffing.
- Internal links to 1–3 related Career Reads articles where helpful.
- Cover image and `alt` text set; no `TODO`s left.
- `npm run content:check` passes.

## 6. Publish

1. Set `status: published` and the intended `publishedAt`.
2. Commit and push (or merge your pull request). Vercel rebuilds and deploys.
3. The article appears on the homepage, listings, category page, search, sitemap, and RSS feed.
4. Optional: request indexing for the URL in Search Console.

## 7. Update or correct

- Edit the file and set `updatedAt` for substantive updates.
- For factual corrections, add a `<Correction>` note at the end, per `/corrections-policy`.
- To unpublish, set `status: draft` — the URL then returns 404 and disappears from the sitemap and RSS.
