import { CalendarDays, Clock, RefreshCw } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { ArticleGrid } from "@/components/article/ArticleGrid";
import { CategoryBadge } from "@/components/article/ArticleCard";
import { AuthorBox } from "@/components/article/AuthorBox";
import { StatsBeacon } from "@/components/analytics/StatsBeacon";
import { MdxContent } from "@/components/article/MdxContent";
import { ShareButtons } from "@/components/article/ShareButtons";
import { TableOfContents } from "@/components/article/TableOfContents";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categories } from "@/lib/categories";
import { hasDatabase } from "@/lib/db";
import { getAllArticles, getArticleBySlug, getAuthor, getRelatedArticles } from "@/lib/content";
import { articleJsonLd } from "@/lib/jsonld";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { formatDate, humanizeTag } from "@/lib/utils";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getAllArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found", robots: { index: false } };

  const author = await getAuthor(article.author);
  const path = `/blog/${article.slug}`;
  const title = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.excerpt;
  const noindex = article.noindex || article.status !== "published";

  return {
    title,
    description,
    alternates: { canonical: article.canonicalUrl ?? absoluteUrl(path) },
    authors: author ? [{ name: author.name, url: absoluteUrl(`/authors/${author.slug}`) }] : undefined,
    keywords: article.tags,
    openGraph: {
      type: "article",
      url: absoluteUrl(path),
      title,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
      section: categories[article.category].name,
      tags: article.tags,
      authors: author ? [absoluteUrl(`/authors/${author.slug}`)] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noindex && { robots: { index: false, follow: false } }),
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [author, related] = await Promise.all([getAuthor(article.author), getRelatedArticles(article, 3)]);
  const category = categories[article.category];
  const url = absoluteUrl(`/blog/${article.slug}`);
  const isUpdated = article.updatedAt && article.updatedAt.slice(0, 10) !== article.publishedAt.slice(0, 10);

  return (
    <>
      {hasDatabase() && article.status === "published" && <StatsBeacon path={`/blog/${article.slug}`} />}
      {article.status !== "published" && (
        <div role="status" className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
          Draft preview — this article is not published and is only visible in local development.
        </div>
      )}

      <article>
        <header className="container-page pt-8 sm:pt-12">
          <Breadcrumbs
            items={[
              { name: "Blog", path: "/blog" },
              { name: category.name, path: `/category/${category.slug}` },
              { name: article.title, path: `/blog/${article.slug}` },
            ]}
          />
          <div className="mx-auto mt-8 max-w-3xl text-center">
            <CategoryBadge slug={article.category} />
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              {article.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">{article.excerpt}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted">
              {author && (
                <Link href={`/authors/${author.slug}`} className="inline-flex items-center gap-2 font-medium text-foreground hover:text-link">
                  <Image src={author.avatar} alt="" width={28} height={28} className="h-7 w-7 rounded-full" />
                  {author.name}
                </Link>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden />
                <span className="sr-only">Published</span>
                <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
              </span>
              {isUpdated && (
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Updated <time dateTime={article.updatedAt}>{formatDate(article.updatedAt!)}</time>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden /> {article.readingTimeMinutes} min read
              </span>
            </div>
          </div>
          <div className="relative mx-auto mt-10 aspect-[16/9] max-w-6xl overflow-hidden rounded-[2rem] bg-surface">
            <Image
              src={article.coverImage}
              alt={article.coverAlt}
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1280px) 1152px, 100vw"
              className="object-cover"
            />
          </div>
        </header>

        <div className="container-page mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-16">
          <div className="mx-auto w-full min-w-0 max-w-3xl">
            <TableOfContents items={article.toc} variant="inline" />
            <div className="prose prose-lg prose-article max-w-none dark:prose-invert prose-headings:font-semibold prose-img:rounded-2xl">
              <MdxContent source={article.content} adsEnabled={article.ads} images={article.images} />
            </div>

            <footer className="mt-12 space-y-8 border-t border-border pt-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <ul className="flex flex-wrap gap-2" aria-label="Tags">
                  {article.tags.map((tag) => (
                    <li key={tag}>
                      <Link
                        href={`/search?q=${encodeURIComponent(tag)}`}
                        className="inline-block rounded-full bg-surface px-3 py-1 text-sm capitalize text-muted hover:text-link"
                      >
                        #{humanizeTag(tag)}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ShareButtons url={url} title={article.title} />
              </div>
              {author && <AuthorBox author={author} />}
              <p className="text-sm text-muted">
                Spotted an error? See our{" "}
                <Link href="/corrections-policy" className="text-link underline-offset-2 hover:underline">
                  corrections policy
                </Link>{" "}
                or{" "}
                <Link href="/contact" className="text-link underline-offset-2 hover:underline">
                  contact the editors
                </Link>
                .
              </p>
            </footer>

            {article.ads && <AdSlot placement="below-article" />}
          </div>

          <aside className="hidden lg:block" aria-label="Article sidebar">
            <div className="sticky top-24 space-y-8">
              <TableOfContents items={article.toc} variant="sidebar" />
              {article.ads && <AdSlot placement="sidebar" className="my-0" />}
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="container-page mt-20">
          <SectionHeading id="related-heading" eyebrow="Keep reading" title="Related articles" />
          <ArticleGrid articles={related} />
        </section>
      )}

      <JsonLd data={articleJsonLd(article, author)} />
    </>
  );
}
