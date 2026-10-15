import { Briefcase, Building2, CalendarDays, FileText } from "lucide-react";
import Link from "next/link";
import { applicationStatus, shortDate, type StatusTone } from "@/lib/candidate/application-status";
import type { MyApplication } from "@/lib/candidate/types";
import { cn } from "@/lib/utils";

const tones: Record<StatusTone, string> = {
  waiting: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  sent: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  progress: "bg-violet-500/15 text-violet-800 dark:text-violet-200",
  good: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  closed: "bg-surface text-muted",
};

/** Their applications, newest first, each with the employer's status in plain words. */
export function MyApplications({ applications }: { applications: MyApplication[] }) {
  return (
    <section className="mt-8" aria-labelledby="my-applications">
      <h2 id="my-applications" className="flex items-center gap-2 text-xl font-semibold">
        <Briefcase className="h-5 w-5 text-link" aria-hidden /> My applications
        {applications.length > 0 && <span className="text-base font-normal text-muted">({applications.length})</span>}
      </h2>

      {applications.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="font-medium">You haven&apos;t applied for any jobs yet.</p>
          <p className="mt-1 text-sm text-muted">Jobs you apply for on Career Reads show up here, with what the employer has decided.</p>
          <Link href="/jobs" className="mt-4 inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white hover:opacity-90">
            Browse jobs
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3" data-testid="my-applications">
          {applications.map((application) => (
            <ApplicationItem key={application.id} application={application} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ApplicationItem({ application }: { application: MyApplication }) {
  const status = applicationStatus(application);
  const { job } = application;
  return (
    <li className="rounded-2xl border border-border bg-background p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-semibold">
            {job.open ? (
              <Link href={`/jobs/${job.slug}`} className="hover:text-link hover:underline">
                {job.title}
              </Link>
            ) : (
              job.title
            )}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <Building2 className="h-4 w-4 shrink-0" aria-hidden /> {job.company}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-sm font-semibold", tones[status.tone])}>{status.label}</span>
      </div>

      <p className="mt-3 text-sm">{status.hint}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" aria-hidden /> Applied {shortDate(application.appliedAt)}
        </span>
        {application.status !== "new" && !application.awaitingConfirmation && <span>Updated {shortDate(application.statusChangedAt)}</span>}
        {application.cv && (
          <a
            href={`/account/applications/${application.id}/cv`}
            target="_blank"
            rel="noopener"
            className="inline-flex min-w-0 items-center gap-1.5 font-medium text-link hover:underline"
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">CV sent: {application.cv.name}</span>
          </a>
        )}
      </div>
    </li>
  );
}
