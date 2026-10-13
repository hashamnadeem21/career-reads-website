import type { Metadata } from "next";
import { BlogListing } from "@/components/article/BlogListing";
import { getCategoryCounts } from "@/lib/content";
import { loadBlogPage } from "@/lib/listing";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

const description =
  "Browse every Career Reads article: practical guides on technology, AI tools, productivity, travel, lifestyle, and personal development.";

export const metadata: Metadata = buildMetadata({
  title: "Practical guides on technology, AI, productivity and travel",
  description,
  path: "/blog",
});

export default async function BlogPage() {
  const [result, counts] = await Promise.all([loadBlogPage(), getCategoryCounts()]);
  return (
    <BlogListing
      eyebrow="The Career Reads library"
      title="Practical guides for work and everyday life"
      highlight="Practical guides"
      description={description}
      summary="Career Reads publishes plain-language guides on technology, AI tools, productivity, travel, lifestyle, and personal development. Each guide is researched by our editorial team and shows when it was published and last updated."
      basePath="/blog"
      result={result}
      counts={counts}
      crumbs={[{ name: "Blog", path: "/blog" }]}
    />
  );
}
