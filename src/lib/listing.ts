import { notFound } from "next/navigation";
import { getArticleSummaries, getArticlesByCategory, paginate, parsePageParam } from "@/lib/content";
import { getCategory, type Category } from "@/lib/categories";
import { ensureSiteData } from "@/lib/site-data";
import { siteConfig } from "@/lib/site";

/** Shared data loaders for paginated listing routes. */

export async function loadBlogPage(pageParam?: string) {
  const page = pageParam === undefined ? 1 : parsePageParam(pageParam);
  if (page === null) notFound();
  const result = paginate(await getArticleSummaries(), page, siteConfig.pageSize);
  if (page > result.totalPages) notFound();
  return result;
}

export async function blogPageParams() {
  const total = (await getArticleSummaries()).length;
  const pages = Math.ceil(total / siteConfig.pageSize);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export async function loadCategoryPage(slug: string, pageParam?: string) {
  await ensureSiteData();
  const category = getCategory(slug);
  if (!category) notFound();
  const page = pageParam === undefined ? 1 : parsePageParam(pageParam);
  if (page === null) notFound();
  const result = paginate(await getArticlesByCategory(category.slug), page, siteConfig.pageSize);
  if (page > result.totalPages) notFound();
  return { category, ...result };
}

export function categoryTitle(category: Category, page: number): string {
  return page > 1 ? `${category.headline} — Page ${page}` : category.headline;
}
