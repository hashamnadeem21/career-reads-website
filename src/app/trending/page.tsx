import { Flame, Info, UserCheck } from "lucide-react";
import type { Metadata } from "next";
import { ArticleGrid } from "@/components/article/ArticleGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeader } from "@/components/ui/SectionHeading";
import { getTrendingArticles } from "@/lib/content";
import { collectionPageJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

const title = "Trending articles";
const description =
  "Timely, high-interest guides our editors are highlighting right now — from passkeys and AI tools to smarter travel.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/trending" });

export default async function TrendingPage() {
  const articles = await getTrendingArticles();
  return (
    <>
      <PageHeader
        eyebrow="Editor-curated"
        title={title}
        highlight="Trending"
        description={description}
        crumbs={[{ name: "Trending", path: "/trending" }]}
        facts={[
          { icon: Flame, label: `${articles.length} picks` },
          { icon: UserCheck, label: "Chosen by our editors" },
        ]}
      />
      <div className="container-page py-12">
        <p className="mb-10 flex items-start gap-2 rounded-2xl bg-surface p-4 text-sm text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-link" aria-hidden />
          This list is curated by our editors for timeliness and usefulness. It is not an automated ranking of page
          views.
        </p>
        <ArticleGrid articles={articles} adAfter={3} priorityCount={3} headingLevel={2} />
      </div>
      <JsonLd data={collectionPageJsonLd(title, description, "/trending")} />
    </>
  );
}
