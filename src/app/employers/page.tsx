import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Briefcase,
  ClipboardCheck,
  FileText,
  KeyRound,
  ListChecks,
  MailCheck,
  RefreshCcw,
  Send,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CompanyRequestForm } from "@/components/employers/CompanyRequestForm";
import { PageHeader } from "@/components/ui/SectionHeading";
import { applicationStatus } from "@/lib/candidate/application-status";
import type { ApplicationStatus } from "@/lib/candidate/types";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { ensureSiteData } from "@/lib/site-data";
import { cn } from "@/lib/utils";

const description =
  "Post jobs on Career Reads from your own company dashboard, receive applications with CVs, and keep every candidate updated on their status. Request a company account in two minutes.";

export const metadata: Metadata = buildMetadata({ title: "Hire on Career Reads: company accounts for employers", description, path: "/employers" });

const STEPS = [
  { Icon: Send, title: "Request an account", body: "Tell us about your company and who's hiring. It takes about two minutes." },
  { Icon: ClipboardCheck, title: "We review it", body: "Our team checks every company, usually within two working days, so candidates only see real employers." },
  { Icon: KeyRound, title: "Set your password", body: "Once approved, you get an email with a link to set your password and open your company dashboard." },
  { Icon: Briefcase, title: "Post jobs and hire", body: "Publish jobs, receive applications with CVs, and move each applicant through your process." },
];

const FEATURES = [
  { Icon: Briefcase, title: "Your own company dashboard", body: "Post, edit and close jobs whenever you need. Your jobs show your company's name on Career Reads." },
  { Icon: FileText, title: "Applications with CVs", body: "Candidates apply on Career Reads with their CV, a note and answers to your screening questions." },
  { Icon: RefreshCcw, title: "Status updates, no emails needed", body: "Move an applicant to Reviewed, Shortlisted, Interview or Offer. They see it straight away in their account." },
  { Icon: BellRing, title: "Alerts for new applicants", body: "We email you when someone applies. Reply to that email to reach the candidate directly." },
  { Icon: ListChecks, title: "Screening questions", body: "Ask what matters to you, like notice period or night shifts, and see the answers next to each CV." },
  { Icon: ShieldCheck, title: "Private by design", body: "CVs are stored privately. Only your team and Career Reads' own admins can open them." },
];

const SHOWN: ApplicationStatus[] = ["new", "reviewed", "shortlisted", "interviewing", "offered", "hired", "rejected"];
const ADMIN_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  interviewing: "Interviewing",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const FAQ = [
  {
    q: "Who can request a company account?",
    a: "Any registered business, agency or organisation hiring for real roles. Please use your work email and tell us your company's website if it has one.",
  },
  {
    q: "How long does approval take?",
    a: "Usually within two working days. If we need anything else, we'll reply to the email you give us.",
  },
  {
    q: "Are jobs checked before they go live?",
    a: "Yes. New companies' jobs are reviewed by our editors before they're published, to keep Career Reads free of misleading ads. Trusted companies can publish straight away.",
  },
  {
    q: "Can colleagues use the account too?",
    a: "Yes. Each person gets their own sign-in for your company. Contact us with their name and work email and we'll invite them.",
  },
  {
    q: "How do candidates hear back from us?",
    a: "Change an applicant's status in your dashboard and they see it on their My applications page. For interviews and offers, contact them using the email and phone number on their application.",
  },
  {
    q: "Can we charge candidates to apply?",
    a: "No. Asking candidates for money to apply, interview or get a job isn't allowed on Career Reads, and we close accounts that do.",
  },
];

const tones = {
  waiting: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  sent: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  progress: "bg-violet-500/15 text-violet-800 dark:text-violet-200",
  good: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  closed: "bg-surface-strong text-muted",
} as const;

/** "For employers": how company accounts work, and the form to request one. */
export default async function EmployersPage() {
  await ensureSiteData();
  return (
    <>
      <PageHeader
        eyebrow="For employers"
        title="Hire on Career Reads"
        highlight="Career Reads"
        description="Post jobs from your own company dashboard, receive applications with CVs, and keep every candidate in the loop with one click."
        crumbs={[{ name: "For employers", path: "/employers" }]}
        facts={[
          { icon: BadgeCheck, label: "Verified employers only" },
          { icon: FileText, label: "Applications with CVs" },
          { icon: UsersRound, label: "Candidates see their status" },
        ]}
      >
        <div className="animate-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
          <a href="#request" className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-white transition hover:opacity-90">
            Request a company account <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <a href="#how-it-works" className="inline-flex h-12 items-center rounded-full border border-border bg-background px-6 font-semibold transition hover:bg-surface">
            How it works
          </a>
        </div>
      </PageHeader>

      <section id="how-it-works" aria-labelledby="how-title" className="container-page scroll-mt-24 py-14 sm:py-20">
        <h2 id="how-title" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          How it works
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-muted">From request to your first applicant in four steps.</p>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="relative rounded-2xl border border-border bg-background p-6">
              <span className="absolute right-5 top-5 font-display text-3xl font-bold text-border" aria-hidden>
                {i + 1}
              </span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-link">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="features-title" className="border-y border-border bg-surface">
        <div className="container-page py-14 sm:py-20">
          <h2 id="features-title" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to hire
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted">One place for your jobs and your applicants, without spreadsheets or long email threads.</p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }) => (
              <li key={title} className="rounded-2xl border border-border bg-background p-6">
                <Icon className="h-6 w-6 text-link" aria-hidden />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="status-title" className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div>
          <h2 id="status-title" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Keep candidates in the loop
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Every status you set in your dashboard shows up on the candidate&apos;s <strong className="text-foreground">My applications</strong> page,
            in plain words. No more chasing replies, and no candidate left wondering.
          </p>
          <p className="mt-4 flex items-start gap-2 text-sm text-muted">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-link" aria-hidden />
            For interviews and offers, reach the candidate directly by email or phone from their application.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">What candidates see for each status you set</caption>
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  You set
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  The candidate sees
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SHOWN.map((status) => {
                const view = applicationStatus({ status, awaitingConfirmation: false });
                return (
                  <tr key={status}>
                    <td className="px-4 py-3 align-top font-medium">{ADMIN_LABELS[status]}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[view.tone])}>{view.label}</span>
                      <span className="mt-1 block text-muted">{view.hint}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="border-t border-border bg-surface">
        <div className="container-page max-w-3xl py-14 sm:py-20">
          <h2 id="faq-title" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Questions employers ask
          </h2>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-background">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}
                  <span className="text-xl leading-none text-muted transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="request" aria-labelledby="request-title" className="container-page scroll-mt-24 py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 id="request-title" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Request a company account
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Tell us about your company. We&apos;ll review your request and email you within two working days.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "No cost to candidates, ever",
                "Your first admin account is yours; we can add colleagues",
                "Your details are only used to review and set up your account",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden /> {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">
              Questions first?{" "}
              <Link href="/contact" className="text-link hover:underline">
                Contact us
              </Link>{" "}
              or email{" "}
              <a href={`mailto:${siteConfig.contactEmail}`} className="text-link hover:underline">
                {siteConfig.contactEmail}
              </a>
              .
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-5 sm:p-8">
            <CompanyRequestForm />
          </div>
        </div>
      </section>
    </>
  );
}
