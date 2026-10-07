import type { MetadataRoute } from "next";
import { categoryList } from "@/lib/categories";
import { ensureSiteData } from "@/lib/site-data";
import { getAllArticles, getAuthors } from "@/lib/content";
import { getJobs } from "@/lib/jobs";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

const STATIC_PATHS = [
  "/",
  "/jobs",
  "/blog",
  "/latest",
  "/trending",
  "/about",
  "/contact",
  "/editorial-policy",
  "/corrections-policy",
  "/privacy-policy",
  "/terms",
  "/advertising-disclosure",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, authors, jobs] = await Promise.all([getAllArticles(), getAuthors(), getJobs(), ensureSiteData()]);
  const indexable = articles.filter((a) => a.status === "published" && !a.noindex && !a.canonicalUrl);

  return [
    ...STATIC_PATHS.map((path) => ({ url: absoluteUrl(path) })),
    ...categoryList.map((c) => ({ url: absoluteUrl(`/category/${c.slug}`) })),
    ...indexable.map((a) => ({ url: absoluteUrl(`/blog/${a.slug}`), lastModified: a.updatedAt ?? a.publishedAt })),
    ...authors.map((a) => ({ url: absoluteUrl(`/authors/${a.slug}`) })),
    ...jobs.filter((j) => !j.sample).map((j) => ({ url: absoluteUrl(`/jobs/${j.slug}`), lastModified: j.postedAt })),
  ];
}
