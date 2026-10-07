import { cache } from "react";
import type { CategorySlug } from "@/lib/categories";
import { ensureSiteData } from "@/lib/site-data";
import { hasApi } from "@/lib/api/client";
import { canPreviewDrafts } from "@/lib/env";
import { MdxContentRepository } from "./mdx-repository";
import { ApiContentRepository } from "./api-repository";
import type { ContentRepository } from "./repository";
import type { Article, ArticleSummary, Author } from "./schema";
import { searchArticles } from "./search";
import { isPubliclyVisible, toSummary } from "./visibility";

export type { Article, ArticleSummary, Author, TocItem } from "./schema";
export { paginate, pageHref, parsePageParam } from "./pagination";
export type { Page } from "./pagination";
export { isPubliclyVisible, toSummary } from "./visibility";

/**
 * Content service layer. Pages and components import from here only.
 *
 * Content comes from the Career Reads API when API_URL is set (managed in the
 * admin panel), and from the MDX files in `content/` otherwise.
 */
let repository: ContentRepository | null = null;

export function getRepository(): ContentRepository {
  if (!repository) {
    repository = hasApi() ? new ApiContentRepository() : new MdxContentRepository();
  }
  return repository;
}

/** For tests or alternative backends. */
export function setRepository(next: ContentRepository | null): void {
  repository = next;
}

/** All articles the current environment is allowed to show, newest first. */
export const getAllArticles = cache(async (): Promise<Article[]> => {
  const [articles] = await Promise.all([getRepository().listArticles(), ensureSiteData()]);
  if (canPreviewDrafts()) return articles;
  const now = new Date();
  return articles.filter((a) => isPubliclyVisible(a, now));
});

export const getArticleSummaries = cache(async (): Promise<ArticleSummary[]> => {
  return (await getAllArticles()).map(toSummary);
});

export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const articles = await getAllArticles();
  return articles.find((a) => a.slug === slug) ?? null;
});

export async function getLatestArticles(limit?: number): Promise<ArticleSummary[]> {
  const all = await getArticleSummaries();
  return limit ? all.slice(0, limit) : all;
}

export async function getFeaturedArticles(limit = 3): Promise<ArticleSummary[]> {
  const all = await getArticleSummaries();
  const featured = all.filter((a) => a.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

/** Editorially curated (`trending: true` in frontmatter) — never inferred from fake metrics. */
export async function getTrendingArticles(limit?: number): Promise<ArticleSummary[]> {
  const trending = (await getArticleSummaries()).filter((a) => a.trending);
  return limit ? trending.slice(0, limit) : trending;
}

export async function getEditorsPicks(limit = 4): Promise<ArticleSummary[]> {
  return (await getArticleSummaries()).filter((a) => a.editorsPick).slice(0, limit);
}

export async function getArticlesByCategory(category: CategorySlug): Promise<ArticleSummary[]> {
  return (await getArticleSummaries()).filter((a) => a.category === category);
}

export async function getArticlesByAuthor(authorSlug: string): Promise<ArticleSummary[]> {
  return (await getArticleSummaries()).filter((a) => a.author === authorSlug);
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const a of await getArticleSummaries()) counts[a.category] = (counts[a.category] ?? 0) + 1;
  return counts;
}

/** Tags used across the curated trending + most recent articles, most frequent first. */
export async function getTopicTags(limit = 12): Promise<{ tag: string; count: number }[]> {
  const all = await getArticleSummaries();
  const pool = [...all.filter((a) => a.trending), ...all.slice(0, 8)];
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  for (const a of pool) {
    if (seen.has(a.slug)) continue;
    seen.add(a.slug);
    for (const tag of a.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

/** Related = same category and/or shared tags, weighted, newest as tiebreaker. */
export async function getRelatedArticles(article: ArticleSummary, limit = 3): Promise<ArticleSummary[]> {
  const all = await getArticleSummaries();
  return all
    .filter((a) => a.slug !== article.slug)
    .map((a) => {
      const sharedTags = a.tags.filter((t) => article.tags.includes(t)).length;
      return { a, score: sharedTags * 2 + (a.category === article.category ? 3 : 0) };
    })
    .filter(({ score }) => score > 0)
    .sort((x, y) => y.score - x.score || y.a.publishedAt.localeCompare(x.a.publishedAt))
    .slice(0, limit)
    .map(({ a }) => a);
}

export async function search(query: string) {
  return searchArticles(await getAllArticles(), query);
}

export const getAuthors = cache(async (): Promise<Author[]> => getRepository().listAuthors());

export const getAuthor = cache(async (slug: string): Promise<Author | null> => getRepository().getAuthor(slug));
