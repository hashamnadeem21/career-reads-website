import type { Article } from "@/lib/content/schema";

export function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    slug: "sample-article",
    title: "A Sample Article About Passkeys",
    excerpt: "An excerpt that is long enough to satisfy the schema validation rules for excerpts.",
    category: "technology",
    tags: ["security", "passkeys"],
    author: "editorial-team",
    publishedAt: "2026-09-01T00:00:00.000Z",
    status: "published",
    featured: false,
    trending: false,
    editorsPick: false,
    coverImage: "/images/covers/sample.svg",
    coverAlt: "A sample cover image",
    coverWidth: 1600,
    coverHeight: 900,
    images: [],
    noindex: false,
    ads: true,
    readingTimeMinutes: 3,
    wordCount: 600,
    content: "## Intro\nPasskeys replace passwords with key pairs.",
    toc: [],
    ...overrides,
  };
}
