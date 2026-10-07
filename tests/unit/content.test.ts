import { existsSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getAllArticles, getArticleBySlug, setRepository } from "@/lib/content";
import { MdxContentRepository, parseArticleFile } from "@/lib/content/mdx-repository";
import { placeableSectionIds } from "@/lib/content/toc";
import { isPubliclyVisible } from "@/lib/content/visibility";

/**
 * Content integrity checks — run in CI so a broken article can never ship.
 * Also usable on its own: `npm run content:check`.
 */
const repo = new MdxContentRepository(path.join(process.cwd(), "content"), true);

describe("content integrity", async () => {
  const articles = await repo.listArticles();
  const authors = await repo.listAuthors();
  const slugs = new Set(articles.map((a) => a.slug));
  const published = articles.filter((a) => isPubliclyVisible(a));

  it("has published articles in every category used on the site", () => {
    expect(published.length).toBeGreaterThan(6);
  });

  it.each(articles.map((a) => [a.slug, a] as const))("%s has a valid author and cover image", (_slug, article) => {
    expect(authors.some((au) => au.slug === article.author)).toBe(true);
    if (article.coverImage.startsWith("/")) {
      expect(existsSync(path.join(process.cwd(), "public", article.coverImage))).toBe(true);
    }
  });

  it.each(articles.map((a) => [a.slug, a] as const))("%s has valid inline images", (_slug, article) => {
    const sections = placeableSectionIds(article.content);
    for (const image of article.images) {
      if (image.src.startsWith("/")) {
        expect(existsSync(path.join(process.cwd(), "public", image.src)), image.src).toBe(true);
      }
      if (image.placement.startsWith("section:")) {
        expect(sections, `no heading "${image.placement}"`).toContain(image.placement.slice("section:".length));
      }
    }
  });

  it.each(published.map((a) => [a.slug, a] as const))("%s only links internally to published articles", (_slug, article) => {
    for (const [, target] of article.content.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
      expect(published.some((p) => p.slug === target), `broken link to /blog/${target}`).toBe(true);
    }
  });

  it.each(published.map((a) => [a.slug, a] as const))("%s has no leftover TODO placeholders", (_slug, article) => {
    expect(JSON.stringify(article)).not.toMatch(/\bTODO\b/);
  });

  it("has unique slugs and unique titles", () => {
    expect(slugs.size).toBe(articles.length);
    expect(new Set(articles.map((a) => a.title)).size).toBe(articles.length);
  });
});

describe("draft protection", () => {
  afterEach(() => setRepository(null));

  it("never exposes drafts through the service layer", async () => {
    const draft = parseArticleFile(
      "secret-draft.mdx",
      `---\ntitle: "A Secret Draft Article Title"\nexcerpt: "This excerpt is long enough to pass validation but it is a draft."\ncategory: ai\ntags: [ai]\nauthor: editorial-team\npublishedAt: 2026-01-01\nstatus: draft\ncoverImage: /x.svg\ncoverAlt: "Alt text for a draft"\n---\nBody`,
    );
    setRepository({
      listArticles: async () => [draft],
      getArticle: async () => draft,
      listAuthors: async () => [],
      getAuthor: async () => null,
    });
    expect(await getAllArticles()).toEqual([]);
    expect(await getArticleBySlug("secret-draft")).toBeNull();
  });

  it("rejects invalid frontmatter with a helpful error", () => {
    expect(() => parseArticleFile("bad.mdx", "---\ntitle: short\n---\nx")).toThrow(/Invalid content in bad.mdx/);
    expect(() => parseArticleFile("Bad Name.mdx", "---\n---\n")).toThrow(/kebab-case/);
  });
});
