import type { Metadata } from "next";
import { BlogListing } from "@/components/article/BlogListing";
import { getCategoryCounts } from "@/lib/content";
import { loadBlogPage } from "@/lib/listing";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

const description =
  "Browse every Career Reads article: practical guides on technology, AI tools, productivity, travel, lifestyle, and personal development.";

export const metadata: Metadata = buildMetadata({ title: "All articles", description, path: "/blog" });

export default async function BlogPage() {
  const [result, counts] = await Promise.all([loadBlogPage(), getCategoryCounts()]);
  return (
    <BlogListing
      eyebrow="The Career Reads library"
      title="All articles"
      description={description}
      basePath="/blog"
      result={result}
      counts={counts}
      crumbs={[{ name: "Blog", path: "/blog" }]}
    />
  );
}
