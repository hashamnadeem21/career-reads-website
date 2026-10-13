import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  Code,
  ExternalLink,
  GraduationCap,
  Laptop,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { FeaturedBento } from "@/components/home/FeaturedBento";
import { KeyLearnings } from "@/components/home/KeyLearnings";
import { NewsletterBand } from "@/components/home/NewsletterBand";
import { TopicIndex } from "@/components/home/TopicIndex";
import { JsonLd } from "@/components/seo/JsonLd";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categoryList } from "@/lib/categories";
import { getArticleSummaries, getCategoryCounts, getEditorsPicks, getFeaturedArticles, getTrendingArticles } from "@/lib/content";
import { getJobCategoryCounts, getJobs } from "@/lib/jobs";
import { jobCategoryList } from "@/lib/jobs/categories";
import { faqPageJsonLd, itemListJsonLd, type FaqItem } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — Latest jobs and practical guides`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

const shortcuts = [
  { href: "/jobs?model=remote", label: "Remote jobs", icon: Laptop },
  { href: "/jobs?type=internship", label: "Internships", icon: GraduationCap },
  { href: "/jobs?category=software-it", label: "Software & IT", icon: Code },
];

const principles = [
  {
    icon: ExternalLink,
    title: "Apply with the employer",
    body: "Every job links to the employer's own application page or email. We never ask you to apply through us.",
  },
  {
    icon: CalendarClock,
    title: "Expired jobs come down",
    body: "A listing stays up through its last day to apply, then comes off the site, so you don't waste time on closed roles.",
  },
  {
    icon: ShieldCheck,
    title: "Researched and dated",
    body: "Guides are checked against primary sources where possible and show both their publish date and their last update.",
    link: { href: "/editorial-policy", label: "Editorial policy" },
  },
  {
    icon: BadgeCheck,
    title: "Independent",
    body: "Ads, when shown, are clearly labeled. Advertisers never influence what we write or recommend.",
    link: { href: "/advertising-disclosure", label: "Advertising disclosure" },
  },
];

export default async function HomePage() {
  const [jobs, jobCounts, allArticles, articleCounts, featured, editorsPicks, trending] = await Promise.all([
    getJobs(),
    getJobCategoryCounts(),
    getArticleSummaries(),
    getCategoryCounts(),
    getFeaturedArticles(3),
    getEditorsPicks(12),
    getTrendingArticles(),
  ]);

  // getJobs() already sorts featured first, then newest.
  const featuredJobs = jobs.slice(0, 4);
  const remoteCount = jobs.filter((job) => job.workModel === "remote").length;
  const internshipCount = jobs.filter((job) => job.employmentType === "internship").length;

  // Learnings come from guides not already featured above, curated picks first.
  const featuredSlugs = new Set(featured.map((a) => a.slug));
  const learnings = [
    ...new Map([...editorsPicks, ...trending, ...allArticles].map((a) => [a.slug, a])).values(),
  ]
    .filter((a) => !featuredSlugs.has(a.slug))
    .slice(0, 6);

  const lastUpdated = [...jobs.map((j) => j.postedAt), ...allArticles.map((a) => a.updatedAt ?? a.publishedAt)]
    .sort()
    .at(-1);

  const stats = [
    { label: "Open jobs", value: jobs.length, href: "/jobs" },
    { label: "Remote roles", value: remoteCount, href: "/jobs?model=remote" },
    { label: "Guides", value: allArticles.length, href: "/blog" },
    { label: "Topics", value: categoryList.length, href: "/blog" },
  ];

  const summary = `${siteConfig.name} is an independent site that lists current job openings in tech, business, design, and more, and publishes practical guides on technology, AI, productivity, travel, and everyday life. You apply to jobs directly with the employer, and listings are removed once their deadline passes.`;

  const faqs: (FaqItem & { link?: { href: string; label: string } })[] = [
    { question: `What is ${siteConfig.name}?`, answer: summary },
    {
      question: `How do I apply for a job on ${siteConfig.name}?`,
      answer:
        "Open the job and use its apply button. It takes you to the employer's own application page or opens an email to them, so your application goes straight to the employer.",
      link: { href: "/jobs", label: "Browse open jobs" },
    },
    {
      question: "How up to date are the job listings?",
      answer:
        "Listings refresh automatically within the hour. Each job shows the date it was posted, and a job is taken down once its last day to apply has passed.",
    },
    {
      question: "Can I find remote jobs and internships?",
      answer: `Yes. Right now there ${remoteCount === 1 ? "is 1 remote role" : `are ${remoteCount} remote roles`} and ${
        internshipCount === 1 ? "1 internship" : `${internshipCount} internships`
      } listed. Use the filters on the jobs page to narrow by work model, job type, category, and experience level.`,
      link: { href: "/jobs?model=remote", label: "See remote jobs" },
    },
    {
      question: `Who writes the guides on ${siteConfig.name}?`,
      answer:
        "Our editorial team researches each guide against primary sources where possible, edits it for clarity and accuracy, and updates it when the facts change.",
      link: { href: "/editorial-policy", label: "Read our editorial policy" },
    },
    {
      question: "How can I get new guides by email?",
      answer:
        "Sign up for the weekly newsletter at the bottom of this page. It's one email a week, and you can unsubscribe in one click.",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          faqPageJsonLd(faqs),
          itemListJsonLd("Featured guides and jobs", [
            ...featured.map((a) => `/blog/${a.slug}`),
            ...featuredJobs.map((j) => `/jobs/${j.slug}`),
          ]),
        ]}
      />

      {/* Hero: answer-first summary + search on the left, live numbers on the right */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_70%)]"
        />
        <div className="container-page relative grid gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-12 lg:py-20">
          <div className="lg:col-span-7">
            <p className="animate-rise eyebrow">Jobs · Guides · Learnings</p>
            <h1
              className="animate-rise mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Latest jobs and <span className="text-gradient">practical guides</span>, in one place.
            </h1>

            <div
              className="animate-rise mt-8 max-w-2xl border-l-4 border-brand pl-5"
              style={{ animationDelay: "160ms" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">In short</p>
              <p className="mt-2 text-lg leading-relaxed">{summary}</p>
            </div>

            <form
              action="/jobs"
              method="get"
              role="search"
              className="animate-rise mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-background p-2 shadow-lg shadow-blue-500/5 sm:flex-row"
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
              <button type="submit" className="h-12 rounded-xl bg-brand px-6 font-semibold text-white hover:opacity-90">
                Search jobs
              </button>
            </form>
            <p className="animate-rise mt-3 text-sm text-muted" style={{ animationDelay: "280ms" }}>
              Looking for a guide instead?{" "}
              <Link href="/search" className="font-semibold text-link hover:underline">
                Search the guides
              </Link>
            </p>
          </div>

          <aside
            aria-labelledby="at-a-glance"
            className="animate-rise self-start rounded-3xl bg-navy p-6 ring-1 ring-white/10 text-white shadow-2xl shadow-blue-900/20 sm:p-8 lg:col-span-5"
            style={{ animationDelay: "200ms" }}
          >
            <h2 id="at-a-glance" className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              At a glance
            </h2>
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
              {stats.map(({ label, value, href }) => (
                <div key={label} className="relative bg-navy p-4 transition-colors hover:bg-white/5">
                  <dt className="text-sm text-white/70">
                    <Link href={href} className="after:absolute after:inset-0">
                      {label}
                    </Link>
                  </dt>
                  <dd className="mt-1 font-display text-4xl font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            {lastUpdated && (
              <p className="mt-5 flex items-center gap-2 text-sm text-white/70">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                Last updated <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
              </p>
            )}
            <nav aria-label="Job shortcuts" className="mt-6 border-t border-white/10 pt-6">
              <ul className="flex flex-wrap gap-2">
                {shortcuts.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-sm font-medium hover:border-white/40 hover:bg-white/10"
                    >
                      <Icon className="h-4 w-4 text-sky-300" aria-hidden />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </section>

      {/* Featured: one lead guide, two more, and the featured jobs */}
      <section aria-labelledby="featured" className="container-page py-16">
        <SectionHeading
          id="featured"
          eyebrow="Featured"
          title="Featured guides and jobs"
          description="A few things worth your time right now, picked by our editors."
          href="/blog"
          linkLabel="All guides"
        />
        <FeaturedBento articles={featured} jobs={featuredJobs} />
      </section>

      {/* Key learnings: one quotable idea per guide */}
      {learnings.length > 0 && (
        <section aria-labelledby="learnings" className="border-y border-border bg-surface py-16">
          <div className="container-page">
            <SectionHeading
              id="learnings"
              eyebrow="Learnings"
              title="Key learnings from our guides"
              description="The core idea of each guide in a sentence or two. Open one for the full steps."
              href="/trending"
              linkLabel="Trending guides"
            />
            <KeyLearnings articles={learnings} />
          </div>
        </section>
      )}

      <div className="container-page">
        <AdSlot placement="listing" />
      </div>

      {/* Topic index: every hub page with real counts */}
      <section aria-labelledby="explore" className="container-page py-16">
        <SectionHeading
          id="explore"
          eyebrow="Explore"
          title="Browse jobs by category and guides by topic"
          description="Every job category and every guide topic, with how many are live right now."
        />
        <div className="grid gap-12 lg:grid-cols-2">
          <TopicIndex
            id="index-jobs"
            title="Jobs by category"
            unit={["job", "jobs"]}
            entries={jobCategoryList.map((c) => ({
              href: `/jobs?category=${c.slug}`,
              name: c.name,
              count: jobCounts[c.slug] ?? 0,
            }))}
          />
          <TopicIndex
            id="index-topics"
            title="Guides by topic"
            unit={["guide", "guides"]}
            entries={categoryList.map((c) => ({
              href: `/category/${c.slug}`,
              name: c.name,
              count: articleCounts[c.slug] ?? 0,
            }))}
          />
        </div>
      </section>

      {/* How it works: the trust signals behind the listings and guides */}
      <section aria-labelledby="how-it-works" className="bg-navy py-16 text-white dark:border-y dark:border-border dark:bg-surface">
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">How it works</p>
          <h2 id="how-it-works" className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            How {siteConfig.name} works
          </h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, body, link }) => (
              <li key={title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sky-300" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{body}</p>
                {link && (
                  <Link href={link.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-300 hover:underline">
                    {link.label}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ: mirrored in the FAQPage JSON-LD above */}
      <section aria-labelledby="faq" className="container-page grid gap-10 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow mb-2">FAQ</p>
          <h2 id="faq" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-muted">
            Still have a question?{" "}
            <Link href="/contact" className="font-semibold text-link hover:underline">
              Contact the editors
            </Link>
            .
          </p>
        </div>
        <div className="divide-y divide-border border-y border-border lg:col-span-8">
          {faqs.map(({ question, answer, link }) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                <h3>{question}</h3>
                <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{answer}</p>
              {link && (
                <Link href={link.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
                  {link.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </details>
          ))}
        </div>
      </section>

      <div className="pb-16">
        <NewsletterBand />
      </div>
    </>
  );
}
