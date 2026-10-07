import { BookOpen, Briefcase, Code, GraduationCap, Laptop, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { ArticleGrid } from "@/components/article/ArticleGrid";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { HeroScene } from "@/components/home/HeroScene";
import { NewsletterBand } from "@/components/home/NewsletterBand";
import { JobList, defaultJobCategoryIcon, jobCategoryIcons } from "@/components/jobs/JobCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getCategoryCounts, getLatestArticles } from "@/lib/content";
import { getJobCategoryCounts, getJobs } from "@/lib/jobs";
import { jobCategoryList } from "@/lib/jobs/categories";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — Latest jobs and practical guides`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

/** Shortcut tags that float around the 3D scene. */
const floatingTags = [
  { href: "/jobs?category=software-it", label: "Software & IT", icon: Code, className: "left-0 top-[12%]", delay: "0s" },
  { href: "/jobs?model=remote", label: "Remote jobs", icon: Laptop, className: "right-0 top-[38%]", delay: "1.2s" },
  { href: "/jobs?type=internship", label: "Internships", icon: GraduationCap, className: "bottom-[10%] left-[8%]", delay: "2.4s" },
];

const quickLinks = [
  { href: "/jobs", label: "All jobs", icon: Briefcase },
  { href: "/jobs?type=internship", label: "Internships", icon: GraduationCap },
  { href: "/jobs?model=remote", label: "Remote jobs", icon: Laptop },
  { href: "/blog", label: "Blog", icon: BookOpen },
];

export default async function HomePage() {
  const [jobs, jobCounts, articles, articleCounts] = await Promise.all([
    getJobs(),
    getJobCategoryCounts(),
    getLatestArticles(6),
    getCategoryCounts(),
  ]);

  return (
    <>
      {/* Hero: job search on the left, animated 3D scene on the right */}
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_40%,color-mix(in_oklab,var(--brand)_12%,transparent),transparent_60%)]"
        />
        <div className="container-page relative grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-20">
          <div>
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-link">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> Fresh jobs, updated regularly
            </p>
            <h1
              className="animate-rise mt-5 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Find your next job. <span className="text-gradient">Learn something useful.</span>
            </h1>
            <p className="animate-rise mt-5 max-w-xl text-lg leading-relaxed text-muted" style={{ animationDelay: "160ms" }}>
              Fresh job openings in tech, business, design, and more, plus simple guides on technology, AI, and
              everyday life.
            </p>

            <form
              action="/jobs"
              method="get"
              role="search"
              className="animate-rise mt-8 flex max-w-xl flex-col gap-2 rounded-xl border border-border bg-background p-2 shadow-lg shadow-blue-500/5 sm:flex-row"
              style={{ animationDelay: "240ms" }}
            >
              <label htmlFor="home-q" className="sr-only">
                Search jobs
              </label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  id="home-q"
                  name="q"
                  type="search"
                  placeholder="Job title, company, or city"
                  className="h-12 w-full rounded-lg bg-transparent pl-10 pr-3 text-base focus:outline-none"
                />
              </div>
              <button type="submit" className="h-12 rounded-lg bg-brand px-6 font-semibold text-white hover:opacity-90">
                Search jobs
              </button>
            </form>

            <nav aria-label="Quick links" className="animate-rise mt-6" style={{ animationDelay: "320ms" }}>
              <ul className="flex flex-wrap gap-2">
                {quickLinks.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium hover:border-brand hover:text-link"
                    >
                      <Icon className="h-4 w-4 text-link" aria-hidden />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-md lg:max-w-none">
            <HeroScene className="absolute inset-0 h-full w-full" />
            {floatingTags.map(({ href, label, icon: Icon, className, delay }) => (
              <Link
                key={href}
                href={href}
                style={{ animationDelay: delay }}
                className={`animate-float absolute hidden items-center gap-2 rounded-xl border border-border bg-background/90 px-3 py-2 text-sm font-semibold shadow-lg shadow-blue-500/10 backdrop-blur hover:border-brand hover:text-link sm:inline-flex ${className}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-strong text-link" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Job categories */}
      <section aria-labelledby="job-categories" className="container-page py-14">
        <SectionHeading id="job-categories" title="Browse jobs by category" href="/jobs" linkLabel="All jobs" />
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {jobCategoryList.map((category) => {
            const Icon = jobCategoryIcons[category.slug] ?? defaultJobCategoryIcon;
            const count = jobCounts[category.slug] ?? 0;
            return (
              <li key={category.slug}>
                <Link
                  href={`/jobs?category=${category.slug}`}
                  className="flex h-full items-center gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-brand"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-strong text-link" aria-hidden>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-snug">{category.name}</span>
                    <span className="text-xs text-muted">
                      {count} {count === 1 ? "job" : "jobs"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Latest jobs */}
      <section aria-labelledby="latest-jobs" className="container-page pb-14">
        <SectionHeading id="latest-jobs" title="Latest jobs" href="/jobs" linkLabel="See all jobs" />
        {jobs.length > 0 ? (
          <JobList jobs={jobs.slice(0, 6)} />
        ) : (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted">
            New jobs are coming soon. Check back shortly.
          </p>
        )}
      </section>

      <div className="container-page">
        <AdSlot placement="listing" className="mt-0" />
      </div>

      {/* Latest articles */}
      <section aria-labelledby="latest-articles" className="container-page py-14">
        <SectionHeading id="latest-articles" title="Latest articles" href="/blog" linkLabel="All articles" />
        <ArticleGrid articles={articles} />
      </section>

      {/* Blog categories */}
      <section aria-labelledby="blog-categories" className="bg-surface py-14">
        <div className="container-page">
          <SectionHeading id="blog-categories" title="Read by topic" href="/blog" linkLabel="All articles" />
          <CategoryGrid counts={articleCounts} />
        </div>
      </section>

      <div className="pt-14">
        <NewsletterBand />
      </div>
    </>
  );
}
