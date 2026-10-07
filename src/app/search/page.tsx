import { Search as SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArticleMetaLine, CategoryBadge } from "@/components/article/ArticleCard";
import { PageHeader } from "@/components/ui/SectionHeading";
import { getTopicTags, search } from "@/lib/content";
import { normalizeQuery } from "@/lib/content/search";
import { absoluteUrl } from "@/lib/site";
import { humanizeTag } from "@/lib/utils";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = normalizeQuery((await searchParams).q);
  return {
    title: q ? `Search results for “${q}”` : "Search articles",
    description: "Search Career Reads articles by title, topic, category, or tag.",
    alternates: { canonical: absoluteUrl("/search") },
    // Internal search result pages should not be indexed.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const query = normalizeQuery(Array.isArray(raw) ? raw[0] : raw);
  const [results, topics] = await Promise.all([query ? search(query) : Promise.resolve([]), getTopicTags(12)]);

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title={query ? `Results for “${query}”` : "Search articles"}
        description="Search across titles, article text, categories, and tags."
      >
        <form action="/search" method="get" role="search" className="mt-8 flex max-w-2xl gap-3">
          <label htmlFor="search-q" className="sr-only">
            Search articles
          </label>
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="search-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Try “passkeys”, “travel”, or “ai tools”"
              maxLength={100}
              autoComplete="off"
              className="h-14 w-full rounded-full border border-border bg-background pl-12 pr-5 text-base outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
            />
          </div>
          <button
            type="submit"
            className="h-14 rounded-full bg-gradient-to-r from-brand to-brand-2 px-6 font-semibold text-white shadow-lg shadow-blue-500/25 hover:brightness-110"
          >
            Search
          </button>
        </form>
      </PageHeader>

      <div className="container-page py-12">
        {query && (
          <p className="mb-8 text-sm text-muted" role="status" data-testid="search-summary">
            {results.length === 0
              ? `No articles matched “${query}”.`
              : `${results.length} ${results.length === 1 ? "article" : "articles"} found.`}
          </p>
        )}

        {results.length > 0 && (
          <ol className="max-w-3xl divide-y divide-border" data-testid="search-results">
            {results.map(({ article, snippet }) => (
              <li key={article.slug} className="group relative py-6">
                <CategoryBadge slug={article.category} />
                <h2 className="mt-3 font-display text-2xl font-semibold leading-snug">
                  <Link href={`/blog/${article.slug}`} className="after:absolute after:inset-0 group-hover:text-link">
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-2 text-muted">{snippet}</p>
                <ArticleMetaLine article={article} className="mt-3" />
              </li>
            ))}
          </ol>
        )}

        {(!query || results.length === 0) && (
          <section aria-labelledby="suggestions-heading" className="max-w-3xl">
            <h2 id="suggestions-heading" className="font-display text-xl font-semibold">
              Popular topics
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {topics.map(({ tag }) => (
                <li key={tag}>
                  <Link
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="inline-block rounded-full border border-border px-3 py-1.5 text-sm capitalize text-muted hover:border-brand hover:text-link"
                  >
                    {humanizeTag(tag)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
