import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ArticleCard } from "@/components/article/ArticleCard";
import { JobCard } from "@/components/jobs/JobCard";
import { categories } from "@/lib/categories";
import type { ArticleSummary } from "@/lib/content";
import type { Job } from "@/lib/jobs";
import { formatDate } from "@/lib/utils";

/** One lead guide with its cover as the backdrop — the largest tile on the home page. */
function LeadArticle({ article }: { article: ArticleSummary }) {
  return (
    <article className="group relative flex min-h-[26rem] flex-col justify-end isolate overflow-hidden rounded-3xl bg-navy text-white lg:h-full">
      <Image
        src={article.coverImage}
        alt={article.coverAlt}
        fill
        priority
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="-z-10 object-cover opacity-70 transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/70 to-transparent" />
      <div className="p-6 sm:p-8">
        <Link
          href={`/category/${article.category}`}
          className="relative z-10 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur hover:bg-white/25"
        >
          {categories[article.category].name}
        </Link>
        <h3 className="mt-4 max-w-xl font-display text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl">
          <Link href={`/blog/${article.slug}`} className="after:absolute after:inset-0 after:z-0">
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">{article.excerpt}</p>
        <p className="mt-4 text-xs text-white/70">
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time> · {article.readingTimeMinutes} min read
        </p>
      </div>
    </article>
  );
}

export function FeaturedBento({ articles, jobs }: { articles: ArticleSummary[]; jobs: Job[] }) {
  const [lead, ...rest] = articles;

  return (
    <div className="space-y-10">
      {lead && (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <LeadArticle article={lead} />
          </div>
          <ul className="grid gap-5 lg:col-span-5">
            {rest.map((article) => (
              <li key={article.slug}>
                <ArticleCard article={article} variant="horizontal" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {jobs.length > 0 && (
        <div>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Featured and newest jobs</h3>
            <Link href="/jobs" className="group inline-flex items-center gap-1 text-sm font-semibold text-link">
              All open jobs
              <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <li key={job.slug}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
