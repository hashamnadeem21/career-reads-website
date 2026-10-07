import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { JobList } from "@/components/jobs/JobCard";
import { PageHeader } from "@/components/ui/SectionHeading";
import { filterJobs, getJobs, type JobFilters } from "@/lib/jobs";
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  WORK_MODELS,
  employmentTypeLabels,
  experienceLabels,
  isJobCategorySlug,
  jobCategories,
  jobCategoryList,
  workModelLabels,
} from "@/lib/jobs/categories";
import { ensureSiteData } from "@/lib/site-data";
import { absoluteUrl } from "@/lib/site";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<SearchParams> };

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim().slice(0, 100) || undefined;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

async function parseFilters(params: SearchParams): Promise<JobFilters> {
  await ensureSiteData();
  const category = first(params.category);
  return {
    q: first(params.q),
    category: category && isJobCategorySlug(category) ? category : undefined,
    type: oneOf(first(params.type), EMPLOYMENT_TYPES),
    model: oneOf(first(params.model), WORK_MODELS),
    experience: oneOf(first(params.experience), EXPERIENCE_LEVELS),
  };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = await parseFilters(await searchParams);
  const filtered = Object.values(filters).some(Boolean);
  const category = filters.category ? jobCategories[filters.category] : undefined;
  return {
    title: category ? `${category.name} jobs` : "Latest jobs",
    description: "Browse the latest jobs in tech, design, marketing, sales, finance, support, and more.",
    alternates: { canonical: absoluteUrl("/jobs") },
    // Filtered views are variations of /jobs and should not be indexed separately.
    ...(filtered && { robots: { index: false, follow: true } }),
  };
}

const selectClass =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-brand focus:outline-none";

export default async function JobsPage({ searchParams }: Props) {
  const filters = await parseFilters(await searchParams);
  const jobs = filterJobs(await getJobs(), filters);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader title="Find jobs" description="Fresh openings in tech, business, design, support, and more. Updated regularly.">
        <form action="/jobs" method="get" role="search" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)_auto]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <label htmlFor="jobs-q" className="sr-only">
              Job title, company, or city
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="jobs-q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Job title, company, or city"
              className={`${selectClass} pl-9`}
            />
          </div>
          <label className="sr-only" htmlFor="jobs-category">
            Category
          </label>
          <select id="jobs-category" name="category" defaultValue={filters.category ?? ""} className={selectClass}>
            <option value="">All categories</option>
            {jobCategoryList.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="jobs-type">
            Job type
          </label>
          <select id="jobs-type" name="type" defaultValue={filters.type ?? ""} className={selectClass}>
            <option value="">Any job type</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {employmentTypeLabels[t]}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="jobs-model">
            Work model
          </label>
          <select id="jobs-model" name="model" defaultValue={filters.model ?? ""} className={selectClass}>
            <option value="">On-site / remote</option>
            {WORK_MODELS.map((m) => (
              <option key={m} value={m}>
                {workModelLabels[m]}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="jobs-experience">
            Experience
          </label>
          <select id="jobs-experience" name="experience" defaultValue={filters.experience ?? ""} className={selectClass}>
            <option value="">Any experience</option>
            {EXPERIENCE_LEVELS.map((e) => (
              <option key={e} value={e}>
                {experienceLabels[e]}
              </option>
            ))}
          </select>
          <button type="submit" className="h-11 rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:opacity-90">
            Search
          </button>
        </form>
      </PageHeader>

      <div className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" role="status">
            {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
          </p>
          {hasFilters && (
            <Link href="/jobs" className="text-sm font-semibold text-link hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-semibold">No jobs match your search.</p>
            <p className="mt-2 text-sm text-muted">Try fewer filters, or check back soon. New jobs are added regularly.</p>
          </div>
        ) : (
          <>
            <JobList jobs={jobs.slice(0, 6)} headingLevel={2} />
            {/* One listing ad after the first six jobs. */}
            {jobs.length > 6 && (
              <>
                <AdSlot placement="listing" />
                <JobList jobs={jobs.slice(6)} headingLevel={2} />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
