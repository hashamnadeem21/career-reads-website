import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  Code,
  Compass,
  ExternalLink,
  GraduationCap,
  Hash,
  Laptop,
  MapPin,
  Rocket,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { AtAGlance, type GlanceStat } from "@/components/home/AtAGlance";
import { FeaturedBento } from "@/components/home/FeaturedBento";
import { HeroGlobe } from "@/components/home/HeroGlobe";
import { HomeFaq, type HomeFaqItem } from "@/components/home/HomeFaq";
import { KeyLearnings } from "@/components/home/KeyLearnings";
import { NewsletterBand } from "@/components/home/NewsletterBand";
import { TopicIndex } from "@/components/home/TopicIndex";
import { JsonLd } from "@/components/seo/JsonLd";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categories, categoryList } from "@/lib/categories";
import {
  getArticleSummaries,
  getCategoryCounts,
  getEditorsPicks,
  getFeaturedArticles,
  getTopicTags,
  getTrendingArticles,
} from "@/lib/content";
import { getJobCategoryCounts, getJobs } from "@/lib/jobs";
import { jobCategories, jobCategoryList } from "@/lib/jobs/categories";
import { faqPageJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { humanizeTag } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — Latest jobs and practical guides`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

/** Shortcut chips that float around the globe. */
const floatingChips = [
  { href: "/jobs?model=remote", label: "Remote jobs", icon: Laptop, className: "left-0 top-[4%]", delay: "0s" },
  { href: "/jobs?type=internship", label: "Internships", icon: GraduationCap, className: "right-0 top-[12%]", delay: "1.2s" },
  { href: "/jobs?category=software-it", label: "Software & IT", icon: Code, className: "bottom-[4%] right-[6%]", delay: "2.4s" },
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

/** Groups values and counts them, most common first. */
function tally(values: string[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function HomePage() {
  const [jobs, jobCounts, allArticles, articleCounts, featured, editorsPicks, trending, topicTags] = await Promise.all([
    getJobs(),
    getJobCategoryCounts(),
    getArticleSummaries(),
    getCategoryCounts(),
    getFeaturedArticles(3),
    getEditorsPicks(12),
    getTrendingArticles(),
    getTopicTags(14),
  ]);

  // getJobs() already sorts featured first, then newest.
  const featuredJobs = jobs.slice(0, 4);
  const remoteCount = jobs.filter((job) => job.workModel === "remote").length;
  const internshipCount = jobs.filter((job) => job.employmentType === "internship").length;
  const entryCount = jobs.filter((job) => job.experience === "entry").length;
  const cities = tally(jobs.filter((job) => job.city).map((job) => job.city!)).slice(0, 8);
  const companies = tally(jobs.map((job) => job.company)).slice(0, 12);

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

  const stats: GlanceStat[] = [
    { label: "Open jobs", value: jobs.length, href: "/jobs", icon: Briefcase, hint: "Hiring right now" },
    { label: "Remote roles", value: remoteCount, href: "/jobs?model=remote", icon: Laptop, hint: "Work from anywhere" },
    { label: "Internships", value: internshipCount, href: "/jobs?type=internship", icon: GraduationCap, hint: "Start your career" },
    { label: "Guides", value: allArticles.length, href: "/blog", icon: BookOpen, hint: "Practical how-tos" },
    { label: "Topics", value: categoryList.length, href: "/blog", icon: Hash, hint: "Explore by subject" },
  ];

  // Starting points. Category links are dropped if that category was removed in the admin panel.
  const hasTopic = (slug: string) => categoryList.some((c) => c.slug === slug);
  const hasJobCategory = (slug: string) => jobCategoryList.some((c) => c.slug === slug);
  const paths: { icon: LucideIcon; title: string; body: string; links: { href: string; label: string }[] }[] = [
    {
      icon: Rocket,
      title: "Starting your career",
      body: "First roles, internships, and the habits that help you learn fast once you land one.",
      links: [
        { href: "/jobs?type=internship", label: `Internships (${internshipCount})` },
        { href: "/jobs?experience=entry", label: `Entry-level jobs (${entryCount})` },
        ...(hasTopic("personal-development")
          ? [{ href: "/category/personal-development", label: `${categories["personal-development"].name} guides` }]
          : []),
      ],
    },
    {
      icon: Laptop,
      title: "Working remotely",
      body: "Roles you can do from anywhere, and guides on focus, routines, and a workspace that works.",
      links: [
        { href: "/jobs?model=remote", label: `Remote jobs (${remoteCount})` },
        ...(hasTopic("productivity") ? [{ href: "/category/productivity", label: `${categories.productivity.name} guides` }] : []),
        ...(hasTopic("lifestyle") ? [{ href: "/category/lifestyle", label: `${categories.lifestyle.name} guides` }] : []),
      ],
    },
    {
      icon: Code,
      title: "Building tech and AI skills",
      body: "Software and IT openings, plus plain-language guides on the tools changing how work gets done.",
      links: [
        ...(hasJobCategory("software-it")
          ? [{ href: "/jobs?category=software-it", label: `${jobCategories["software-it"].name} jobs (${jobCounts["software-it"] ?? 0})` }]
          : []),
        ...(hasTopic("ai") ? [{ href: "/category/ai", label: `${categories.ai.name} guides` }] : []),
        ...(hasTopic("technology") ? [{ href: "/category/technology", label: `${categories.technology.name} guides` }] : []),
      ],
    },
  ];

  const summary = `${siteConfig.name} is an independent site that lists current job openings in tech, business, design, and more, and publishes practical guides on technology, AI, productivity, travel, and everyday life. You apply to jobs directly with the employer, and listings are removed once their deadline passes.`;

  const faqs: HomeFaqItem[] = [
    { group: "site", question: `What is ${siteConfig.name}?`, answer: summary },
    {
      group: "jobs",
      question: `How do I apply for a job on ${siteConfig.name}?`,
      answer:
        "Open the job and use its apply button. It takes you to the employer's own application page or opens an email to them, so your application goes straight to the employer.",
      link: { href: "/jobs", label: "Browse open jobs" },
    },
    {
      group: "jobs",
      question: "Should I ever pay to apply for a job?",
      answer:
        "No. Legitimate employers don't charge you to apply or to be interviewed. If a listing asks you for money, don't pay, and tell us about it through the contact page.",
      link: { href: "/contact", label: "Report a listing" },
    },
    {
      group: "jobs",
      question: "How up to date are the job listings?",
      answer:
        "Listings refresh automatically within the hour. Each job shows the date it was posted, and a job is taken down once its last day to apply has passed.",
    },
    {
      group: "jobs",
      question: "Can I find remote jobs and internships?",
      answer: `Yes. Right now there ${remoteCount === 1 ? "is 1 remote role" : `are ${remoteCount} remote roles`} and ${plural(
        internshipCount,
        "internship",
        "internships",
      )} listed. Use the filters on the jobs page to narrow by work model, job type, category, and experience level.`,
      link: { href: "/jobs?model=remote", label: "See remote jobs" },
    },
    ...(cities.length > 0
      ? [
          {
            group: "jobs" as const,
            question: "Which cities have jobs listed right now?",
            answer: `Right now: ${cities.map((c) => `${c.name} (${c.count})`).join(", ")}${
              remoteCount > 0 ? `, plus ${plural(remoteCount, "remote role", "remote roles")}` : ""
            }. Type a city into the job search to see only the jobs there.`,
          },
        ]
      : []),
    {
      group: "site",
      question: `Who writes the guides on ${siteConfig.name}?`,
      answer:
        "Our editorial team researches each guide against primary sources where possible, edits it for clarity and accuracy, and updates it when the facts change.",
      link: { href: "/editorial-policy", label: "Read our editorial policy" },
    },
    {
      group: "site",
      question: "Do you use AI to write the guides?",
      answer:
        "Writers may use AI tools for brainstorming, outlining, or checking clarity. A human editor is responsible for every published guide, verifies facts independently, and makes all editorial decisions. We don't publish unreviewed AI-generated content.",
    },
    {
      group: "site",
      question: "How do I find a guide on a specific topic?",
      answer: `Search the guides by keyword, or browse by topic: ${categoryList.map((c) => c.name).join(", ")}.`,
      link: { href: "/search", label: "Search the guides" },
    },
    {
      group: "site",
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

      {/* Hero: answer-first summary + search on the left, 3D globe on the right */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_45%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent_55%)]"
        />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
          <div className="lg:col-span-7">
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-link">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> Jobs · Guides · Learnings
            </p>
            <h1
              className="animate-rise mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Latest jobs and <span className="text-gradient">practical guides</span>, in one place.
            </h1>

            <div className="animate-rise mt-10 max-w-2xl border-l-4 border-brand pl-5" style={{ animationDelay: "160ms" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">In short</p>
              <p className="mt-2 text-lg leading-relaxed">{summary}</p>
            </div>

            <form
              action="/jobs"
              method="get"
              role="search"
              className="animate-rise mt-10 flex max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-background p-2 shadow-lg shadow-blue-500/5 sm:flex-row"
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
            <p className="animate-rise mt-4 text-sm text-muted" style={{ animationDelay: "280ms" }}>
              Looking for a guide instead?{" "}
              <Link href="/search" className="font-semibold text-link hover:underline">
                Search the guides
              </Link>
            </p>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[24rem] sm:max-w-md lg:col-span-5 lg:max-w-none">
            <HeroGlobe className="absolute inset-0 h-full w-full" />
            {floatingChips.map(({ href, label, icon: Icon, className, delay }) => (
              <Link
                key={href}
                href={href}
                style={{ animationDelay: delay }}
                className={`animate-float absolute hidden items-center gap-2 rounded-xl border border-border bg-background/85 px-3 py-2 text-sm font-semibold shadow-lg shadow-blue-500/10 backdrop-blur hover:border-brand hover:text-link sm:inline-flex ${className}`}
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

      {/* At a glance: live numbers from the same data the pages use */}
      <AtAGlance stats={stats} lastUpdated={lastUpdated} />

      {/* Start here: three common goals, each with its jobs and guides */}
      <section aria-labelledby="start-here" className="container-page py-20 sm:py-24 lg:py-28">
        <SectionHeading
          id="start-here"
          eyebrow="Start here"
          title="Pick a path"
          description="Three common goals, each with the jobs and guides that go with it."
        />
        <ul className="mt-4 grid gap-6 md:grid-cols-3 lg:gap-8">
          {paths.map(({ icon: Icon, title, body, links }, i) => (
            <li
              key={title}
              className="group relative overflow-hidden rounded-3xl border border-border bg-background p-7 transition duration-300 hover:-translate-y-1 sm:p-8 hover:border-brand/40 hover:shadow-xl hover:shadow-blue-500/10"
            >
              <span aria-hidden className="absolute right-5 top-4 font-display text-6xl font-bold text-surface-strong">
                {i + 1}
              </span>
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-lg shadow-blue-500/25" aria-hidden>
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="relative mt-5 font-display text-xl font-semibold">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted">{body}</p>
              <ul className="relative mt-6 space-y-1.5 border-t border-border pt-5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-surface hover:text-link">
                      {link.label}
                      <ArrowRight className="h-4 w-4 text-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured: one lead guide, two more, and the featured jobs */}
      <section aria-labelledby="featured" className="border-t border-border bg-surface/50 py-20 sm:py-24 lg:py-28">
        <div className="container-page">
          <SectionHeading
            id="featured"
            eyebrow="Featured"
            title="Featured guides and jobs"
            description="A few things worth your time right now, picked by our editors."
            href="/blog"
            linkLabel="All guides"
          />
          <div className="mt-4">
            <FeaturedBento articles={featured} jobs={featuredJobs} />
          </div>
        </div>
      </section>

      {/* Key learnings: one quotable idea per guide */}
      {learnings.length > 0 && (
        <section aria-labelledby="learnings" className="border-y border-border bg-surface py-20 sm:py-24 lg:py-28">
          <div className="container-page">
            <SectionHeading
              id="learnings"
              eyebrow="Learnings"
              title="Key learnings from our guides"
              description="The core idea of each guide in a sentence or two. Open one for the full steps."
              href="/trending"
              linkLabel="Trending guides"
            />
            <div className="mt-4">
              <KeyLearnings articles={learnings} />
            </div>
          </div>
        </section>
      )}

      {/* Where the jobs are + who is hiring */}
      {jobs.length > 0 && (
        <section aria-labelledby="hiring" className="container-page py-20 sm:py-24 lg:py-28">
          <SectionHeading
            id="hiring"
            eyebrow="Hiring now"
            title="Where the jobs are, and who's hiring"
            description="Cities and companies with open roles on the site today."
            href="/jobs"
            linkLabel="All open jobs"
          />
          <div className="mt-4 grid gap-8 lg:grid-cols-5">
            <div className="rounded-3xl border border-border p-7 sm:p-8 lg:col-span-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                <MapPin className="h-4 w-4 text-link" aria-hidden /> Jobs by city
              </h3>
              <ul className="mt-6 space-y-4">
                {cities.map(({ name, count }) => (
                  <li key={name}>
                    <Link href={`/jobs?q=${encodeURIComponent(name)}`} className="group block">
                      <span className="flex items-baseline justify-between text-sm">
                        <span className="font-medium group-hover:text-link">{name}</span>
                        <span className="tabular-nums text-muted">{plural(count, "job", "jobs")}</span>
                      </span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-strong" aria-hidden>
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-brand to-brand-2"
                          style={{ width: `${Math.max(8, (count / cities[0].count) * 100)}%` }}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
                {remoteCount > 0 && (
                  <li>
                    <Link href="/jobs?model=remote" className="flex items-center justify-between rounded-xl bg-surface-strong px-3 py-2 text-sm font-semibold text-link">
                      <span className="inline-flex items-center gap-2">
                        <Laptop className="h-4 w-4" aria-hidden /> Remote, work from anywhere
                      </span>
                      <span className="tabular-nums">{remoteCount}</span>
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-border p-7 sm:p-8 lg:col-span-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                <Building2 className="h-4 w-4 text-link" aria-hidden /> Companies hiring
              </h3>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {companies.map(({ name, count }) => (
                  <li key={name}>
                    <Link
                      href={`/jobs?q=${encodeURIComponent(name)}`}
                      className="group flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:border-brand"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-surface-strong to-surface font-display text-sm font-bold text-link"
                        aria-hidden
                      >
                        {name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold group-hover:text-link">{name}</span>
                        <span className="text-xs text-muted">{plural(count, "open role", "open roles")}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition group-hover:rotate-45 group-hover:text-link" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <div className="container-page">
        <AdSlot placement="listing" />
      </div>

      {/* Topic index: every hub page with real counts, plus popular tags */}
      <section aria-labelledby="explore" className="border-t border-border py-20 sm:py-24 lg:py-28">
        <div className="container-page">
          <SectionHeading
            id="explore"
            eyebrow="Explore"
            title="Browse jobs by category and guides by topic"
            description="Every job category and every guide topic, with how many are live right now."
          />
          <div className="mt-4 grid gap-14 lg:grid-cols-2 lg:gap-20">
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
          {topicTags.length > 0 && (
            <div className="mt-16 rounded-3xl bg-surface p-7 sm:p-10">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                <Compass className="h-4 w-4 text-link" aria-hidden /> Popular in our guides
              </h3>
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {topicTags.map(({ tag }) => (
                  <li key={tag}>
                    <Link
                      href={`/search?q=${encodeURIComponent(humanizeTag(tag))}`}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium capitalize hover:border-brand hover:text-link"
                    >
                      <Hash className="h-3.5 w-3.5 text-muted" aria-hidden />
                      {humanizeTag(tag)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* How it works: the trust signals behind the listings and guides */}
      <section aria-labelledby="how-it-works" className="bg-navy py-20 text-white sm:py-24 lg:py-28 dark:border-y dark:border-border dark:bg-surface">
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">How it works</p>
          <h2 id="how-it-works" className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            How {siteConfig.name} works
          </h2>
          <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
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
      <section aria-labelledby="faq" className="container-page py-20 sm:py-24 lg:py-28">
        <HomeFaq items={faqs} />
      </section>

      <div className="pb-20 sm:pb-24 lg:pb-28">
        <NewsletterBand />
      </div>
    </>
  );
}
