import "server-only";
import { desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import readingTime from "reading-time";
import { z } from "zod";
import { articles as articlesTable, authors as authorsTable, type ArticleRow, type AuthorRow } from "@/db/schema";
import type { Database } from "@/lib/db";
import type { ContentRepository } from "./repository";
import { articleFrontmatterSchema, authorSchema, type Article, type Author } from "./schema";
import { extractToc } from "./toc";

/** Maps a database row to an Article, validated with the same schema as the MDX files. */
export function rowToArticle(row: ArticleRow): Article | null {
  const parsed = articleFrontmatterSchema.safeParse({
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    tags: row.tags,
    author: row.author,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt ?? undefined,
    status: row.status,
    featured: row.featured,
    trending: row.trending,
    editorsPick: row.editorsPick,
    coverImage: row.coverImage,
    coverAlt: row.coverAlt,
    coverWidth: row.coverWidth,
    coverHeight: row.coverHeight,
    images: row.images,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    canonicalUrl: row.canonicalUrl ?? undefined,
    noindex: row.noindex,
    ads: row.ads,
  });
  if (!parsed.success) {
    // One bad row must not take the whole site down; it is skipped and logged.
    console.error(`Skipping article "${row.slug}" from the database:\n${z.prettifyError(parsed.error)}`);
    return null;
  }
  const stats = readingTime(row.body);
  return {
    ...parsed.data,
    slug: row.slug,
    content: row.body,
    toc: extractToc(row.body),
    wordCount: stats.words,
    readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
  };
}

export function rowToAuthor(row: AuthorRow): Author | null {
  const parsed = authorSchema.safeParse({ ...row, links: row.links ?? {} });
  if (!parsed.success) {
    console.error(`Skipping author "${row.slug}" from the database:\n${z.prettifyError(parsed.error)}`);
    return null;
  }
  return parsed.data;
}

/**
 * Reads content from PostgreSQL. Results are cached and tagged (`articles`,
 * `authors`) so the admin panel can refresh them instantly via /api/revalidate.
 */
export class PostgresContentRepository implements ContentRepository {
  private readonly cachedArticles: () => Promise<Article[]>;
  private readonly cachedAuthors: () => Promise<Author[]>;

  constructor(private readonly db: Database) {
    this.cachedArticles = unstable_cache(
      async () => {
        const rows = await this.db.select().from(articlesTable).orderBy(desc(articlesTable.publishedAt));
        return rows.map(rowToArticle).filter((a): a is Article => a !== null);
      },
      ["db-articles"],
      { tags: ["articles"], revalidate: 3600 },
    );
    this.cachedAuthors = unstable_cache(
      async () => {
        const rows = await this.db.select().from(authorsTable).orderBy(authorsTable.name);
        return rows.map(rowToAuthor).filter((a): a is Author => a !== null);
      },
      ["db-authors"],
      { tags: ["authors"], revalidate: 3600 },
    );
  }

  listArticles(): Promise<Article[]> {
    return this.cachedArticles();
  }

  async getArticle(slug: string): Promise<Article | null> {
    return (await this.listArticles()).find((a) => a.slug === slug) ?? null;
  }

  listAuthors(): Promise<Author[]> {
    return this.cachedAuthors();
  }

  async getAuthor(slug: string): Promise<Author | null> {
    return (await this.listAuthors()).find((a) => a.slug === slug) ?? null;
  }
}

