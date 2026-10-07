import type { Metadata } from "next";
import { BlogListing } from "@/components/article/BlogListing";
import { categoryList, getCategory } from "@/lib/categories";
import { ensureSiteData } from "@/lib/site-data";
import { getCategoryCounts } from "@/lib/content";
import { loadCategoryPage } from "@/lib/listing";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  await ensureSiteData();
  return categoryList.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const counts = await getCategoryCounts();
  return buildMetadata({
    title: category.headline,
    description: category.description,
    path: `/category/${category.slug}`,
    // Don't ask Google to index an empty category page (thin content).
    noindex: !counts[category.slug],
  });
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const [{ category, ...result }, counts] = await Promise.all([loadCategoryPage(slug), getCategoryCounts()]);
  return (
    <BlogListing
      eyebrow={`Category · ${category.name}`}
      title={category.headline}
      description={category.description}
      basePath={`/category/${category.slug}`}
      result={result}
      counts={counts}
      activeCategory={category.slug}
      crumbs={[
        { name: "Blog", path: "/blog" },
        { name: category.name, path: `/category/${category.slug}` },
      ]}
    />
  );
}
