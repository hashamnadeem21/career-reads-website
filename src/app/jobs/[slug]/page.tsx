import { Building2, CalendarDays, Clock, ExternalLink, GraduationCap, Mail, MapPin, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { StatsBeacon, TrackedApplyLink } from "@/components/analytics/StatsBeacon";
import { JobList, JobTag, defaultJobCategoryIcon, jobCategoryIcons } from "@/components/jobs/JobCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { hasApi } from "@/lib/api/client";
import { getJobBySlug, getJobs, getRelatedJobs, jobLocation, type Job } from "@/lib/jobs";
import { employmentTypeLabels, experienceLabels, jobCategories, workModelLabels } from "@/lib/jobs/categories";
import { jobPostingJsonLd } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getJobs()).map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJobBySlug((await params).slug);
  if (!job) return { title: "Job not found", robots: { index: false } };
  const title = `${job.title} at ${job.company}`;
  return {
    title,
    description: job.summary,
    alternates: { canonical: absoluteUrl(`/jobs/${job.slug}`) },
    openGraph: { type: "website", url: absoluteUrl(`/jobs/${job.slug}`), title, description: job.summary },
    ...(job.sample && { robots: { index: false, follow: false } }),
  };
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed marker:text-brand">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function ApplyButton({ job }: { job: Job }) {
  const className =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:opacity-90";
  const statPath = `/jobs/${job.slug}`;
  if (job.applyUrl) {
    return (
      <TrackedApplyLink statPath={statPath} href={job.applyUrl} target="_blank" rel="noopener noreferrer nofollow" className={className}>
        Apply now <ExternalLink className="h-4 w-4" aria-hidden />
      </TrackedApplyLink>
    );
  }
  return (
    <TrackedApplyLink
      statPath={statPath}
      href={`mailto:${job.applyEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}`}
      className={className}
    >
      <Mail className="h-4 w-4" aria-hidden /> Apply by email
    </TrackedApplyLink>
  );
}

export default async function JobPage({ params }: Props) {
  const job = await getJobBySlug((await params).slug);
  if (!job) notFound();

  const related = await getRelatedJobs(job, 4);
  const category = jobCategories[job.category];
  const Icon = jobCategoryIcons[job.category] ?? defaultJobCategoryIcon;

  const facts = [
    { icon: MapPin, label: "Location", value: jobLocation(job) },
    { icon: Clock, label: "Job type", value: `${employmentTypeLabels[job.employmentType]} · ${workModelLabels[job.workModel]}` },
    { icon: GraduationCap, label: "Experience", value: experienceLabels[job.experience] },
    ...(job.salary ? [{ icon: Wallet, label: "Salary", value: job.salary }] : []),
    { icon: CalendarDays, label: "Posted", value: formatDate(job.postedAt) },
    ...(job.deadline ? [{ icon: CalendarDays, label: "Apply before", value: formatDate(job.deadline) }] : []),
  ];

  return (
    <>
      {hasApi() && <StatsBeacon path={`/jobs/${job.slug}`} />}
      {job.sample && (
        <div role="status" className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
          Sample job: shown in development only. Replace it with real listings before going live.
        </div>
      )}

      <article className="container-page pt-8">
        <Breadcrumbs
          items={[
            { name: "Jobs", path: "/jobs" },
            { name: job.title, path: `/jobs/${job.slug}` },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <header className="flex gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-strong text-link" aria-hidden>
                <Icon className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{job.title}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-muted">
                  <Building2 className="h-4 w-4" aria-hidden />
                  {job.companyWebsite ? (
                    <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-link hover:underline">
                      {job.company}
                    </a>
                  ) : (
                    job.company
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <JobTag>{category.name}</JobTag>
                  <JobTag>{employmentTypeLabels[job.employmentType]}</JobTag>
                  <JobTag>{workModelLabels[job.workModel]}</JobTag>
                </div>
              </div>
            </header>

            <p className="mt-8 text-lg leading-relaxed">{job.summary}</p>
            <Section title="Responsibilities" items={job.responsibilities} />
            <Section title="Requirements" items={job.requirements} />
            <Section title="Benefits" items={job.benefits} />

            <div className="mt-10 max-w-xs lg:hidden">
              <ApplyButton job={job} />
            </div>
            <p className="mt-8 rounded-lg bg-surface p-4 text-sm text-muted">
              Never pay anyone to apply for a job. If an employer asks you for money, please{" "}
              <Link href="/contact" className="text-link underline-offset-2 hover:underline">
                report it to us
              </Link>
              .
            </p>
            <AdSlot placement="below-article" />
          </div>

          <aside aria-label="Job summary">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-xl border border-border bg-background p-5">
                <dl className="space-y-4">
                  {facts.map(({ icon: FactIcon, label, value }) => (
                    <div key={label} className="flex gap-3">
                      <FactIcon className="mt-0.5 h-5 w-5 shrink-0 text-link" aria-hidden />
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
                <div className="mt-6">
                  <ApplyButton job={job} />
                </div>
              </div>
              <AdSlot placement="sidebar" className="my-0 hidden lg:block" />
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-jobs" className="container-page mt-16">
          <SectionHeading id="related-jobs" title={`More ${category.name} jobs`} href={`/jobs?category=${category.slug}`} />
          <JobList jobs={related} />
        </section>
      )}

      <JsonLd data={jobPostingJsonLd(job)} />
    </>
  );
}
