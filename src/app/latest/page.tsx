import type { Metadata } from "next";
import { ArticleCard } from "@/components/article/ArticleCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "@/components/ui/SectionHeading";
import { getLatestArticles, type ArticleSummary } from "@/lib/content";
import { collectionPageJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

const LIMIT = 24;
const title = "Latest articles";
const description = "The newest guides and explainers from Career Reads, organized by month of publication.";

export const metadata: Metadata = buildMetadata({ title, description, path: "/latest" });

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

function groupByMonth(articles: ArticleSummary[]) {
  const groups = new Map<string, ArticleSummary[]>();
  for (const a of articles) {
    const key = monthFormatter.format(new Date(a.publishedAt));
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return [...groups.entries()];
}

export default async function LatestPage() {
  const articles = await getLatestArticles(LIMIT);
  const groups = groupByMonth(articles);

  return (
    <>
      <PageHeader eyebrow="Fresh off the press" title={title} description={description}>
        <div className="mt-8">
          <Breadcrumbs items={[{ name: "Latest", path: "/latest" }]} />
        </div>
      </PageHeader>
      <div className="container-page py-12">
        {groups.map(([month, items], gi) => (
          <section key={month} aria-labelledby={`month-${gi}`} className="mb-14">
            <h2 id={`month-${gi}`} className="mb-6 flex items-center gap-4 font-display text-2xl font-semibold">
              {month}
              <span className="h-px flex-1 bg-border" aria-hidden />
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {items.map((article, i) => (
                <Reveal as="li" key={article.slug} delay={(i % 3) * 0.05}>
                  <ArticleCard article={article} priority={gi === 0 && i < 3} />
                </Reveal>
              ))}
            </ul>
            {gi === 0 && groups.length > 1 && <AdSlot placement="listing" />}
          </section>
        ))}
      </div>
      <JsonLd data={collectionPageJsonLd(title, description, "/latest")} />
    </>
  );
}
