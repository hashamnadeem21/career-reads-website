import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { z } from "zod";
import type { ContentRepository } from "./repository";
import { articleFrontmatterSchema, authorSchema, SLUG_PATTERN, type Article, type Author } from "./schema";
import { isCategorySlug } from "@/lib/categories";
import { extractToc } from "./toc";

export class ContentValidationError extends Error {
  constructor(file: string, error: z.ZodError) {
    super(`Invalid content in ${file}:\n${z.prettifyError(error)}`);
    this.name = "ContentValidationError";
  }
}

export function parseArticleFile(fileName: string, source: string): Article {
  const slug = fileName.replace(/\.mdx?$/, "");
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`Article file name "${fileName}" must be a lowercase kebab-case slug.`);
  }

  const { data, content } = matter(source);
  const parsed = articleFrontmatterSchema.safeParse(data);
  if (!parsed.success) throw new ContentValidationError(fileName, parsed.error);
  if (!isCategorySlug(parsed.data.category)) {
    throw new Error(`Invalid content in ${fileName}: unknown category "${parsed.data.category}".`);
  }

  const stats = readingTime(content);
  return {
    ...parsed.data,
    slug,
    content,
    toc: extractToc(content),
    wordCount: stats.words,
    readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
  };
}

/** Reads articles and authors from the `content/` directory. */
export class MdxContentRepository implements ContentRepository {
  private articlesCache: Promise<Article[]> | null = null;
  private authorsCache: Promise<Author[]> | null = null;

  constructor(
    private readonly rootDir: string = path.join(process.cwd(), "content"),
    /** Re-read from disk on every call (useful in development). */
    private readonly disableCache: boolean = process.env.NODE_ENV === "development",
  ) {}

  listArticles(): Promise<Article[]> {
    if (this.disableCache || !this.articlesCache) {
      this.articlesCache = this.loadArticles().catch((error) => {
        this.articlesCache = null;
        throw error;
      });
    }
    return this.articlesCache;
  }

  async getArticle(slug: string): Promise<Article | null> {
    const articles = await this.listArticles();
    return articles.find((a) => a.slug === slug) ?? null;
  }

  listAuthors(): Promise<Author[]> {
    if (this.disableCache || !this.authorsCache) {
      this.authorsCache = this.loadAuthors().catch((error) => {
        this.authorsCache = null;
        throw error;
      });
    }
    return this.authorsCache;
  }

  async getAuthor(slug: string): Promise<Author | null> {
    const authors = await this.listAuthors();
    return authors.find((a) => a.slug === slug) ?? null;
  }

  private async loadArticles(): Promise<Article[]> {
    const dir = path.join(this.rootDir, "articles");
    const files = (await fs.readdir(dir)).filter((f) => /\.mdx?$/.test(f));
    const articles = await Promise.all(
      files.map(async (file) => parseArticleFile(file, await fs.readFile(path.join(dir, file), "utf8"))),
    );
    return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  private async loadAuthors(): Promise<Author[]> {
    const dir = path.join(this.rootDir, "authors");
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
    return Promise.all(
      files.map(async (file) => {
        const json: unknown = JSON.parse(await fs.readFile(path.join(dir, file), "utf8"));
        const parsed = authorSchema.safeParse(json);
        if (!parsed.success) throw new ContentValidationError(file, parsed.error);
        return parsed.data;
      }),
    );
  }
}
