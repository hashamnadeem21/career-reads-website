import type { Metadata } from "next";
import { BlogListing } from "@/components/article/BlogListing";
import { getCategoryCounts } from "@/lib/content";
import { blogPageParams, loadBlogPage } from "@/lib/listing";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ page: string }> };

export function generateStaticParams() {
  return blogPageParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  return buildMetadata({
    title: `All articles — Page ${page}`,
    description: `Page ${page} of the Career Reads article archive: guides on technology, AI tools, productivity, travel, lifestyle, and personal development.`,
    path: `/blog/page/${page}`,
  });
}

export default async function BlogPaginatedPage({ params }: Props) {
  const { page } = await params;
  const [result, counts] = await Promise.all([loadBlogPage(page), getCategoryCounts()]);
  return (
    <BlogListing
      eyebrow="The Career Reads library"
      title={`All articles — Page ${result.page}`}
      description="Every Career Reads guide, newest first."
      basePath="/blog"
      result={result}
      counts={counts}
      crumbs={[
        { name: "Blog", path: "/blog" },
        { name: `Page ${result.page}`, path: `/blog/page/${result.page}` },
      ]}
    />
  );
}
