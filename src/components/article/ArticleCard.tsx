import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/categories";
import type { ArticleSummary } from "@/lib/content";
import { cn, formatDate } from "@/lib/utils";

export function CategoryBadge({ slug, className }: { slug: ArticleSummary["category"]; className?: string }) {
  const category = categories[slug];
  return (
    <Link
      href={`/category/${slug}`}
      className={cn(
        "relative z-10 inline-flex items-center gap-1.5 rounded-full bg-surface-strong px-2.5 py-1 text-xs font-semibold text-link transition-colors hover:bg-brand hover:text-white",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full bg-gradient-to-r", category.accent)} aria-hidden />
      {category.name}
    </Link>
  );
}

export function ArticleMetaLine({ article, className }: { article: ArticleSummary; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted", className)}>
      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        {article.readingTimeMinutes} min read
      </span>
    </p>
  );
}

type Variant = "default" | "horizontal" | "compact";

/**
 * Whole-card click target via a stretched title link (one link per card for
 * screen readers), with the category badge layered above it.
 */
export function ArticleCard({
  article,
  variant = "default",
  priority = false,
  headingLevel = 3,
}: {
  article: ArticleSummary;
  variant?: Variant;
  priority?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  const href = `/blog/${article.slug}`;

  if (variant === "compact") {
    return (
      <article className="group relative flex gap-4">
        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-surface sm:w-24">
          <Image src={article.coverImage} alt="" fill sizes="96px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <Heading className="font-display text-base font-semibold leading-snug text-balance">
            <Link href={href} className="after:absolute after:inset-0 group-hover:text-link">
              {article.title}
            </Link>
          </Heading>
          <ArticleMetaLine article={article} className="mt-2" />
        </div>
      </article>
    );
  }

  const horizontal = variant === "horizontal";

  return (
    <article
      className={cn(
        "group relative flex h-full overflow-hidden rounded-3xl border border-border bg-background transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-blue-500/10",
        horizontal ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface",
          horizontal ? "aspect-[16/9] sm:aspect-auto sm:w-2/5 sm:shrink-0" : "aspect-[16/9]",
        )}
      >
        <Image
          src={article.coverImage}
          alt={article.coverAlt}
          fill
          priority={priority}
          sizes={horizontal ? "(min-width: 640px) 40vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3">
          <CategoryBadge slug={article.category} />
        </div>
        <Heading className="font-display text-xl font-semibold leading-snug tracking-tight text-balance">
          <Link href={href} className="after:absolute after:inset-0 after:z-0 group-hover:text-link">
            {article.title}
          </Link>
        </Heading>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{article.excerpt}</p>
        <ArticleMetaLine article={article} className="mt-auto pt-4" />
      </div>
    </article>
  );
}
