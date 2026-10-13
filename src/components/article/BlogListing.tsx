import { ArticleGrid } from "@/components/article/ArticleGrid";
import { CategoryFilter } from "@/components/article/CategoryFilter";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/ui/Pagination";
import { BookOpen, CalendarClock, Layers } from "lucide-react";
import { PageHeader, type HeroFact } from "@/components/ui/SectionHeading";
import { categoryList, type CategorySlug } from "@/lib/categories";
import { formatDate } from "@/lib/utils";
import type { ArticleSummary, Page } from "@/lib/content";
import type { Crumb } from "@/lib/jsonld";
import { collectionPageJsonLd } from "@/lib/jsonld";

interface Props {
  title: string;
  /** Part of the title to show in the brand gradient. */
  highlight?: string;
  /** "In short" answer shown instead of the description. */
  summary?: string;
  description: string;
  eyebrow: string;
  basePath: string;
  result: Page<ArticleSummary>;
  counts: Record<string, number>;
  activeCategory?: CategorySlug;
  crumbs: Crumb[];
}

export function BlogListing({ title, highlight, summary, description, eyebrow, basePath, result, counts, activeCategory, crumbs }: Props) {
  const path = result.page > 1 ? `${basePath}/page/${result.page}` : basePath;
  const lastUpdated = result.items
    .map((a) => a.updatedAt ?? a.publishedAt)
    .sort()
    .at(-1);
  const facts: HeroFact[] = [
    { icon: BookOpen, label: `${result.totalItems} ${result.totalItems === 1 ? "guide" : "guides"}` },
    ...(activeCategory ? [] : [{ icon: Layers, label: `${categoryList.length} topics` }]),
    ...(lastUpdated ? [{ icon: CalendarClock, label: <>Updated <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time></> }] : []),
  ];
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={result.page > 1 ? `${title} (page ${result.page})` : title}
        highlight={highlight}
        description={description}
        summary={result.page > 1 ? undefined : summary}
        crumbs={crumbs}
        facts={facts}
      />
      <div className="container-page py-12">
        <div className="mb-10">
          <CategoryFilter active={activeCategory} counts={counts} />
        </div>
        {result.items.length > 0 ? (
          <ArticleGrid articles={result.items} adAfter={3} priorityCount={result.page === 1 ? 3 : 0} headingLevel={2} />
        ) : (
          <p className="rounded-3xl border border-dashed border-border p-12 text-center text-muted">
            No articles here yet — check back soon.
          </p>
        )}
        <Pagination basePath={basePath} page={result.page} totalPages={result.totalPages} />
        <p className="mt-6 text-center text-sm text-muted">
          Showing page {result.page} of {result.totalPages} · {result.totalItems} articles
        </p>
      </div>
      <JsonLd data={collectionPageJsonLd(title, description, path)} />
    </>
  );
}
