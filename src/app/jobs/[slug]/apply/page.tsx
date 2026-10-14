import { Building2, MapPin, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthPanel } from "@/components/account/AuthPanel";
import { ApplyForm } from "@/components/jobs/ApplyForm";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { apiGet, apiPath, hasApi } from "@/lib/api/client";
import { currentCandidate } from "@/lib/candidate/session";
import { getJobBySlug, jobLocation } from "@/lib/jobs";
import type { FormQuestion } from "@/lib/jobs/questions";
import { pageTitle } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

/** The employer's current questions, read fresh for every visit so edits show up straight away. */
async function getApplicationForm(slug: string) {
  if (!hasApi()) return null;
  return apiGet<{ job: { slug: string; title: string; company: string }; questions: FormQuestion[] }>(
    apiPath("/public/jobs/{slug}/application-form", { slug }),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJobBySlug((await params).slug);
  return {
    title: job ? pageTitle(`Apply: ${job.title} at ${job.company}`) : "Job not found",
    // A form, not content: never in search results (the job page is).
    robots: { index: false, follow: false },
  };
}

/**
 * Applying on Career Reads. Only for jobs that take applications here; anything else is a 404.
 * It needs an account (Google or email): signed out, the page offers sign-in first.
 */
export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job?.onsiteApply) notFound();
  const [form, candidate] = await Promise.all([getApplicationForm(slug), currentCandidate()]);
  if (!form) notFound();

  return (
    <div className="container-page max-w-3xl pt-8">
      <Breadcrumbs
        items={[
          { name: "Jobs", path: "/jobs" },
          { name: job.title, path: `/jobs/${job.slug}` },
          { name: "Apply", path: `/jobs/${job.slug}/apply` },
        ]}
      />
      <header className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <p className="text-sm font-medium text-link">Apply on Career Reads</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance sm:text-3xl">{job.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4" aria-hidden /> {job.company}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden /> {jobLocation(job)}
          </span>
        </p>
        <p className="mt-3 text-sm">
          <Link href={`/jobs/${job.slug}`} className="font-medium text-link hover:underline">
            Read the job description
          </Link>
        </p>
      </header>

      {candidate ? (
        <section aria-label="Application" className="mt-8 rounded-2xl border border-border bg-background p-5 sm:p-8">
          <ApplyForm
            slug={job.slug}
            jobTitle={job.title}
            company={job.company}
            questions={form.questions}
            candidate={{ name: candidate.name, email: candidate.email, emailVerified: candidate.emailVerified, subscribed: candidate.subscribed }}
          />
        </section>
      ) : (
        <section aria-labelledby="sign-in-to-apply" className="mt-8 rounded-2xl border border-border bg-background p-5 sm:p-8">
          <h2 id="sign-in-to-apply" className="text-center text-xl font-semibold">
            Sign in to apply
          </h2>
          <p className="mx-auto mt-2 mb-6 max-w-md text-center text-sm text-muted">
            A free Career Reads account takes a few seconds. You&apos;ll come straight back here to send your application.
          </p>
          <AuthPanel next={`/jobs/${job.slug}/apply`} />
        </section>
      )}

      <p className="mt-6 flex items-start gap-2 text-sm text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-link" aria-hidden />
        Your CV is only shared with {job.company}. Never pay anyone to apply for a job or to get an interview.
      </p>
    </div>
  );
}
