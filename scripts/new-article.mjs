#!/usr/bin/env node
/**
 * Scaffolds a new DRAFT article with valid frontmatter and generated cover art.
 *
 *   npm run content:new -- "How to Back Up Your Photos" --category technology
 *
 * Categories: technology, ai, lifestyle, productivity, travel, personal-development
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const CATEGORIES = ["technology", "ai", "lifestyle", "productivity", "travel", "personal-development"];
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const title = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const category = flag("category") ?? "technology";
const author = flag("author") ?? "editorial-team";

if (!title || title.length < 10) {
  console.error('Usage: npm run content:new -- "Article title (10+ chars)" --category <slug> [--author <slug>]');
  process.exit(1);
}
if (!CATEGORIES.includes(category)) {
  console.error(`Unknown category "${category}". Use one of: ${CATEGORIES.join(", ")}`);
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 80)
  .replace(/-+$/, "");
const file = path.join("content", "articles", `${slug}.mdx`);
if (existsSync(file)) {
  console.error(`✗ ${file} already exists.`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const template = `---
title: ${JSON.stringify(title)}
excerpt: "TODO: one or two sentences (50–220 characters) that tell readers exactly what they'll learn."
category: ${category}
tags: [TODO-tag]
author: ${author}
publishedAt: ${today}
status: draft
featured: false
trending: false
editorsPick: false
coverImage: /images/covers/${slug}.svg
coverAlt: "TODO: describe the cover image for screen readers"
# Up to 3 extra images inside the article. placement: after-intro | middle | before-conclusion | section:<heading-id>
images:
  - src: /images/articles/${slug}-1.svg
    alt: "TODO: describe this image for screen readers"
    placement: middle
# seoTitle: "Optional, ≤ 70 characters"
# seoDescription: "Optional, 50–170 characters"
---

Open with the reader's problem and what this article will help them do.

## First main section

Write useful, original content. Cite primary sources where they help readers verify claims.

<Callout type="tip" title="Practical tip">
Callouts are great for one key takeaway per section.
</Callout>

## Second main section

## Third main section

An in-article ad is inserted automatically before the third section (unless \`ads: false\`).

## Summary
`;

await writeFile(file, template);
console.log(`✓ Created ${file} (status: draft)`);
execFileSync("node", ["scripts/generate-covers.mjs"], { stdio: "inherit" });
console.log(`
Next steps:
  1. Write the article and fill in every TODO.
  2. Preview locally:  CONTENT_PREVIEW_DRAFTS=true npm run dev  →  /blog/${slug}
  3. Validate:         npm run content:check
  4. Publish: set status: published (and publishedAt), commit, and deploy.`);
