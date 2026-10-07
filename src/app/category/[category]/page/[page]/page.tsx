import type { Metadata } from "next";
import { BlogListing } from "@/components/article/BlogListing";
import { categoryList, getCategory } from "@/lib/categories";
import { ensureSiteData } from "@/lib/site-data";
import { getArticlesByCategory, getCategoryCounts } from "@/lib/content";
import { categoryTitle, loadCategoryPage } from "@/lib/listing";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

type Props = { params: Promise<{ category: string; page: string }> };

export async function generateStaticParams() {
  const params: { category: string; page: string }[] = [];
  await ensureSiteData();
  for (const category of categoryList.map((c) => c.slug)) {
    const pages = Math.ceil((await getArticlesByCategory(category)).length / siteConfig.pageSize);
    for (let p = 2; p <= pages; p++) params.push({ category, page: String(p) });
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug, page } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return buildMetadata({
    title: categoryTitle(category, Number(page)),
    description: `Page ${page} of ${category.name} articles on Career Reads. ${category.description}`.slice(0, 160),
    path: `/category/${category.slug}/page/${page}`,
  });
}

export default async function CategoryPaginatedPage({ params }: Props) {
  const { category: slug, page } = await params;
  const [{ category, ...result }, counts] = await Promise.all([loadCategoryPage(slug, page), getCategoryCounts()]);
  return (
    <BlogListing
      eyebrow={`Category · ${category.name}`}
      title={categoryTitle(category, result.page)}
      description={category.description}
      basePath={`/category/${category.slug}`}
      result={result}
      counts={counts}
      activeCategory={category.slug}
      crumbs={[
        { name: "Blog", path: "/blog" },
        { name: category.name, path: `/category/${category.slug}` },
        { name: `Page ${result.page}`, path: `/category/${category.slug}/page/${result.page}` },
      ]}
    />
  );
}
