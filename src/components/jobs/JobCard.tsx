import {
  Briefcase,
  Building2,
  Calculator,
  Code,
  GraduationCap,
  Headphones,
  MapPin,
  Megaphone,
  Palette,
  ClipboardList,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { employmentTypeLabels, workModelLabels, type JobCategorySlug } from "@/lib/jobs/categories";
import { jobLocation, type Job } from "@/lib/jobs/schema";
import { cn, formatDate } from "@/lib/utils";

/** Icon per job category. Categories added in the admin panel fall back to `defaultJobCategoryIcon`. */
export const jobCategoryIcons: Record<JobCategorySlug, LucideIcon | undefined> = {
  "software-it": Code,
  "design-creative": Palette,
  "marketing-content": Megaphone,
  "sales-business": Briefcase,
  "finance-accounting": Calculator,
  "customer-support": Headphones,
  "operations-admin": ClipboardList,
  "education-training": GraduationCap,
};

export const defaultJobCategoryIcon: LucideIcon = Briefcase;

export function JobTag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md bg-surface-strong px-2 py-0.5 text-xs font-medium text-link", className)}>
      {children}
    </span>
  );
}

/** Whole card is clickable through the stretched title link. */
export function JobCard({ job, headingLevel = 3 }: { job: Job; headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as const;
  const Icon = jobCategoryIcons[job.category] ?? defaultJobCategoryIcon;

  return (
    <article className="group relative flex h-full gap-4 rounded-xl border border-border bg-background p-5 transition-colors hover:border-brand">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-strong text-link" aria-hidden>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <Heading className="text-base font-semibold leading-snug">
          <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0 group-hover:text-link">
            {job.title}
          </Link>
        </Heading>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Building2 className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{job.company}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{jobLocation(job)}</span>
        </p>
        {job.salary && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Wallet className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{job.salary}</span>
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {job.featured && <JobTag className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Featured</JobTag>}
          <JobTag>{employmentTypeLabels[job.employmentType]}</JobTag>
          <JobTag>{workModelLabels[job.workModel]}</JobTag>
          <span className="ml-auto text-xs text-muted">
            Posted <time dateTime={job.postedAt}>{formatDate(job.postedAt)}</time>
          </span>
        </div>
      </div>
    </article>
  );
}

export function JobList({ jobs, headingLevel = 3 }: { jobs: Job[]; headingLevel?: 2 | 3 }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {jobs.map((job) => (
        <li key={job.slug}>
          <JobCard job={job} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
