import "server-only";
import { unstable_cache } from "next/cache";
import { apiGet, apiPath } from "@/lib/api/client";
import { canPreviewDrafts } from "@/lib/env";
import type { ContentRepository } from "./repository";
import type { Article, Author } from "./schema";

/**
 * Reads content from the Career Reads API. Results are cached and tagged (`articles`,
 * `authors`) so the API can refresh them instantly via /api/revalidate after a save.
 * The API applies the visibility rules; drafts come back only for local previews.
 */
export class ApiContentRepository implements ContentRepository {
  private readonly cachedArticles = unstable_cache(
    async (preview: boolean) =>
      (await apiGet<Article[]>(apiPath("/public/articles"), { preview: preview ? "1" : undefined })) ?? [],
    ["api-articles"],
    { tags: ["articles"], revalidate: 3600 },
  );

  private readonly cachedAuthors = unstable_cache(
    async () => (await apiGet<Author[]>(apiPath("/public/authors"))) ?? [],
    ["api-authors"],
    { tags: ["authors"], revalidate: 3600 },
  );

  listArticles(): Promise<Article[]> {
    return this.cachedArticles(canPreviewDrafts());
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
