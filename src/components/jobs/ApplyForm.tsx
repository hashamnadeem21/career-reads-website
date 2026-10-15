"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Info, Loader2, MailCheck, Send, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { resendConfirmation } from "@/app/account/actions";
import { submitApplication } from "@/app/jobs/[slug]/apply/actions";
import { SubscribeDialog } from "@/components/account/SubscribeDialog";
import { FieldError, SpamGuardFields } from "@/components/forms/SpamGuardFields";
import { CV_ACCEPT, MAX_CV_BYTES } from "@/lib/apply/limits";
import { shortDate } from "@/lib/candidate/application-status";
import type { SavedCv } from "@/lib/candidate/types";
import { checkAnswer, type FormQuestion } from "@/lib/jobs/questions";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 aria-[invalid=true]:border-rose-500";

/** Contact details kept in this browser only (never sent anywhere until they apply), to speed up the next application. */
const PROFILE_KEY = "careerreads:apply-profile";
/** The email always comes from the account, so it isn't remembered here. */
const PROFILE_FIELDS = ["name", "phone", "location", "linkedinUrl"] as const;
type Details = Record<(typeof PROFILE_FIELDS)[number] | "email" | "coverLetter", string>;
const emptyDetails: Details = { name: "", email: "", phone: "", location: "", linkedinUrl: "", coverLetter: "" };

type Errors = Record<string, string>;
type AnswerState = Record<string, string | string[]>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s()-]{6,25}$/;
const CV_EXT = /\.(pdf|docx)$/i;

function checkDetails(d: Details): Errors {
  const errors: Errors = {};
  if (d.name.trim().length < 2) errors.name = "Enter your full name";
  if (!EMAIL.test(d.email.trim())) errors.email = "Enter a valid email address";
  if (!PHONE.test(d.phone.trim())) errors.phone = "Enter a phone number, like +92 300 1234567";
  if (d.linkedinUrl.trim() && !/^https?:\/\/\S+\.\S+/.test(d.linkedinUrl.trim()))
    errors.linkedinUrl = "Enter your full LinkedIn address, like https://linkedin.com/in/you";
  return errors;
}

function checkCvFile(file: File | null): Errors {
  if (!file) return { cv: "Attach your CV" };
  if (/\.doc$/i.test(file.name)) return { cv: "Old Word files (.doc) aren't accepted. Save your CV as .docx or PDF" };
  if (!CV_EXT.test(file.name)) return { cv: "Upload your CV as a PDF or Word (.docx) document" };
  if (file.size > MAX_CV_BYTES) return { cv: "Your CV must be 4 MB or smaller" };
  return {};
}

function checkQuestions(questions: FormQuestion[], answers: AnswerState): Errors {
  const errors: Errors = {};
  for (const q of questions) {
    const result = checkAnswer(q, answers[q.id]);
    if ("error" in result) errors[`answers.${q.id}`] = result.error;
  }
  return errors;
}

const kb = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/**
 * The application form, in steps like LinkedIn's Easy Apply: your details → CV → the employer's
 * questions (when there are any) → check and send. Every step stays mounted, so going back keeps
 * what was typed and the whole form (CV included) is sent at the end.
 */
/** The signed-in candidate: the name is a starting point, the email is the account's and can't change here. */
export interface ApplyingCandidate {
  name: string;
  email: string;
  emailVerified: boolean;
  subscribed: boolean;
}

type Outcome = { kind: "sent" | "held" | "already"; message: string };

export function ApplyForm({
  slug,
  jobTitle,
  company,
  questions,
  candidate,
  savedCv = null,
}: {
  slug: string;
  jobTitle: string;
  company: string;
  questions: FormQuestion[];
  candidate: ApplyingCandidate;
  /** The CV on their account: offered (and picked) first, so applying again needs no upload. */
  savedCv?: SavedCv | null;
}) {
  const router = useRouter();
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mountedAt = useRef(0);
  const [pending, start] = useTransition();
  const steps = ["Your details", "CV", ...(questions.length ? ["Questions"] : []), "Review"];
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<Details>({ ...emptyDetails, name: candidate.name, email: candidate.email });
  const [cv, setCv] = useState<File | null>(null);
  const [useSaved, setUseSaved] = useState(Boolean(savedCv));
  const sendSaved = useSaved && savedCv !== null;
  const [answers, setAnswers] = useState<AnswerState>({});
  const [consent, setConsent] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const questionsStep = questions.length ? 2 : -1;
  const reviewStep = steps.length - 1;

  useEffect(() => {
    mountedAt.current = Date.now();
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null") as Partial<Details> | null;
      if (saved) {
        setDetails((d) => ({
          ...d,
          ...Object.fromEntries(PROFILE_FIELDS.map((k) => [k, String(saved[k] ?? "") || d[k]])),
          email: candidate.email,
        }));
      }
    } catch {
      // Storage blocked or unreadable: start empty.
    }
  }, [candidate.email]);

  const goTo = (next: number) => {
    setStep(next);
    setMessage(null);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const stepErrors = (index: number): Errors => {
    if (index === 0) return checkDetails(details);
    if (index === 1) return sendSaved ? {} : checkCvFile(cv);
    if (index === questionsStep) return checkQuestions(questions, answers);
    return consent ? {} : { consent: "Please agree so the employer can see your application" };
  };

  /** The step a field's error belongs to (errors from the API land on the right screen). */
  const stepOf = (field: string) =>
    field.startsWith("answers.") ? questionsStep : field === "cv" || field === "coverLetter" ? 1 : field === "consent" ? reviewStep : 0;

  const next = () => {
    const found = stepErrors(step);
    setErrors(found);
    if (Object.keys(found).length === 0) goTo(step + 1);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < reviewStep) return next();
    const all = [0, 1, questionsStep, reviewStep].filter((s) => s >= 0).reduce<Errors>((acc, s) => ({ ...acc, ...stepErrors(s) }), {});
    setErrors(all);
    const first = Object.keys(all)[0];
    if (first) return goTo(stepOf(first));

    const data = new FormData(formRef.current!);
    data.set("answers", JSON.stringify(answers));
    data.set("consent", "true");
    data.set("startedAt", String(mountedAt.current));
    if (sendSaved) {
      data.delete("cv");
      data.set("useSavedCv", "true");
    } else {
      data.set("cv", cv!, cv!.name);
    }
    start(async () => {
      const result = await submitApplication(slug, data);
      if (result.status === "signed_out") {
        // The page shows sign-in again; what they typed is kept in this browser's memory only.
        setMessage(result.message);
        router.refresh();
        return;
      }
      if (result.status === "success" || result.status === "held" || result.status === "already_applied") {
        try {
          if (remember) localStorage.setItem(PROFILE_KEY, JSON.stringify(Object.fromEntries(PROFILE_FIELDS.map((k) => [k, details[k]]))));
          else localStorage.removeItem(PROFILE_KEY);
        } catch {
          // Not remembered; nothing else depends on it.
        }
        setOutcome({ kind: result.status === "success" ? "sent" : result.status === "held" ? "held" : "already", message: result.message });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const fieldErrors = result.fieldErrors ?? {};
      if (fieldErrors.cv && sendSaved) setUseSaved(false); // the saved CV has gone: upload one instead
      setErrors(fieldErrors);
      setMessage(result.message);
      const firstField = Object.keys(fieldErrors)[0];
      if (firstField) goTo(stepOf(firstField));
    });
  };

  if (outcome?.kind === "held") {
    return (
      <div role="status" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xl font-semibold text-amber-800 dark:text-amber-200">
          <MailCheck className="h-6 w-6" aria-hidden /> Almost done: confirm your email
        </p>
        <p className="mt-3 leading-relaxed">
          Your application for <strong>{jobTitle}</strong> is saved. Open the link we emailed to <strong>{candidate.email}</strong> and it goes to {company}{" "}
          straight away.
        </p>
        <ResendLink />
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/jobs" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-white hover:opacity-90">
            Browse more jobs <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <SubscribeDialog subscribed={candidate.subscribed} />
      </div>
    );
  }

  if (outcome?.kind === "already") {
    return (
      <div role="status" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xl font-semibold">
          <Info className="h-6 w-6 text-link" aria-hidden /> You&apos;ve already applied
        </p>
        <p className="mt-3 leading-relaxed">
          {company} already has your application for <strong>{jobTitle}</strong>, so we didn&apos;t send it twice.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/jobs" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-white hover:opacity-90">
            Browse more jobs <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  if (outcome?.kind === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xl font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-6 w-6" aria-hidden /> Application sent
        </p>
        <p className="mt-3 leading-relaxed">
          {company} now has your CV{questions.length ? " and your answers" : ""} for <strong>{jobTitle}</strong>. We&apos;ve emailed a copy to{" "}
          <strong>{details.email}</strong>. If they&apos;d like to talk, they&apos;ll contact you directly.
        </p>
        <p className="mt-3 text-sm text-muted">Never pay anyone to apply for a job or to get an interview.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/jobs" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-white hover:opacity-90">
            Browse more jobs <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href={`/jobs/${slug}`} className="inline-flex h-11 items-center rounded-full border border-border px-6 font-semibold hover:bg-surface">
            Back to the job
          </Link>
        </div>
        <SubscribeDialog subscribed={candidate.subscribed} />
      </div>
    );
  }

  const field = (name: string) => ({
    id: `${id}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
  });
  const err = (name: string) => (errors[name] ? [errors[name]] : undefined);
  const text = (name: keyof Details, props: { type?: string; autoComplete?: string; inputMode?: "email" | "tel" | "url"; placeholder?: string } = {}) => (
    <input
      {...field(name)}
      name={name}
      type={props.type ?? "text"}
      autoComplete={props.autoComplete}
      inputMode={props.inputMode}
      placeholder={props.placeholder}
      value={details[name]}
      onChange={(e) => setDetails((d) => ({ ...d, [name]: e.target.value }))}
      className={inputClass}
    />
  );
  const label = (name: string, children: string, optional = false) => (
    <label htmlFor={`${id}-${name}`} className="mb-1.5 block text-sm font-medium">
      {children} {optional && <span className="font-normal text-muted">(optional)</span>}
    </label>
  );

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="relative" data-testid="apply-form">
      <SpamGuardFields />
      {!candidate.emailVerified && (
        <p className="mb-6 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <span>
            Please confirm your email ({candidate.email}) using the link we sent you. You can apply now: your application goes to {company} as soon as you confirm.
          </span>
        </p>
      )}

      <ol className="mb-6 flex gap-2" aria-label="Steps">
        {steps.map((name, i) => (
          <li key={name} className="flex-1">
            <span className={cn("block h-1.5 rounded-full", i <= step ? "bg-brand" : "bg-surface-strong")} aria-hidden />
            <span className={cn("mt-2 block text-xs font-medium", i === step ? "text-foreground" : "text-muted")}>
              <span className="sr-only">{i < step ? "Done: " : i === step ? "Current step: " : ""}</span>
              {name}
            </span>
          </li>
        ))}
      </ol>

      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
        {steps[step]}
        <span className="ml-2 text-sm font-normal text-muted">
          Step {step + 1} of {steps.length}
        </span>
      </h2>

      {/* 1. Details */}
      <div hidden={step !== 0} className="mt-5 space-y-5">
        <div>
          {label("name", "Full name")}
          {text("name", { autoComplete: "name" })}
          <FieldError id={`${id}-name-error`} errors={err("name")} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            {label("email", "Email")}
            <input
              {...field("email")}
              type="email"
              value={details.email}
              readOnly
              aria-describedby={`${id}-email-hint`}
              className={cn(inputClass, "cursor-not-allowed bg-surface text-muted")}
            />
            <p id={`${id}-email-hint`} className="mt-1.5 text-sm text-muted">
              Your account&apos;s email. Employers reply here.
            </p>
          </div>
          <div>
            {label("phone", "Phone")}
            {text("phone", { type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "+92 300 1234567" })}
            <FieldError id={`${id}-phone-error`} errors={err("phone")} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            {label("location", "City and country", true)}
            {text("location", { autoComplete: "address-level2", placeholder: "Lahore, Pakistan" })}
            <FieldError id={`${id}-location-error`} errors={err("location")} />
          </div>
          <div>
            {label("linkedinUrl", "LinkedIn profile", true)}
            {text("linkedinUrl", { type: "url", inputMode: "url", placeholder: "https://linkedin.com/in/…" })}
            <FieldError id={`${id}-linkedinUrl-error`} errors={err("linkedinUrl")} />
          </div>
        </div>
      </div>

      {/* 2. CV and note */}
      <div hidden={step !== 1} className="mt-5 space-y-5">
        <div>
          <span className="mb-1.5 block text-sm font-medium">CV</span>
          {savedCv && (
            <fieldset className="mb-3 space-y-2">
              <legend className="sr-only">Which CV to send</legend>
              {[
                { saved: true, title: "Use my saved CV", detail: `${savedCv.name} · ${kb(savedCv.sizeBytes)} · uploaded ${shortDate(savedCv.uploadedAt)}` },
                { saved: false, title: "Upload a different CV", detail: "It also becomes your saved CV for next time." },
              ].map((option) => (
                <label
                  key={option.title}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition hover:bg-surface",
                    useSaved === option.saved ? "border-brand ring-1 ring-brand" : "border-border",
                  )}
                >
                  <input
                    type="radio"
                    name="cvChoice"
                    className="mt-1 accent-brand"
                    checked={useSaved === option.saved}
                    onChange={() => {
                      setUseSaved(option.saved);
                      setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== "cv")));
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{option.title}</span>
                    <span className="block truncate text-sm text-muted">{option.detail}</span>
                  </span>
                </label>
              ))}
              {useSaved && (
                <a href="/account/cv" target="_blank" rel="noopener" className="inline-block text-sm font-medium text-link hover:underline">
                  View my saved CV
                </a>
              )}
            </fieldset>
          )}
          <label
            htmlFor={`${id}-cv`}
            className={cn(
              "cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition hover:border-brand hover:bg-surface",
              errors.cv ? "border-rose-500" : "border-border",
              sendSaved ? "hidden" : "flex",
            )}
          >
            {cv ? (
              <>
                <FileText className="h-8 w-8 text-link" aria-hidden />
                <span className="font-medium">{cv.name}</span>
                <span className="text-sm text-muted">{kb(cv.size)} · Choose a different file</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-link" aria-hidden />
                <span className="font-medium">Upload your CV</span>
                <span className="text-sm text-muted">PDF or Word (.docx), up to 4 MB{savedCv ? "" : ". We'll save it for next time."}</span>
              </>
            )}
          </label>
          <input
            {...field("cv")}
            name="cv"
            type="file"
            accept={CV_ACCEPT}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setCv(file);
              setErrors((current) => {
                const rest = Object.fromEntries(Object.entries(current).filter(([key]) => key !== "cv"));
                return { ...rest, ...checkCvFile(file) };
              });
            }}
          />
          <FieldError id={`${id}-cv-error`} errors={err("cv")} />
        </div>
        <div>
          {label("coverLetter", `A note to ${company}`, true)}
          <textarea
            {...field("coverLetter")}
            name="coverLetter"
            rows={5}
            maxLength={5000}
            value={details.coverLetter}
            onChange={(e) => setDetails((d) => ({ ...d, coverLetter: e.target.value }))}
            placeholder="Why you're a good fit, in a few lines."
            className={cn(inputClass, "resize-y")}
          />
          <FieldError id={`${id}-coverLetter-error`} errors={err("coverLetter")} />
        </div>
      </div>

      {/* 3. The employer's questions */}
      {questions.length > 0 && (
        <div hidden={step !== questionsStep} className="mt-5 space-y-6">
          {questions.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={answers[q.id]}
              error={errors[`answers.${q.id}`]}
              baseId={`${id}-q-${q.id}`}
              onChange={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
            />
          ))}
        </div>
      )}

      {/* 4. Review */}
      <div hidden={step !== reviewStep} className="mt-5 space-y-5">
        <dl className="divide-y divide-border rounded-2xl border border-border">
          {[
            ["Name", details.name],
            ["Email", details.email],
            ["Phone", details.phone],
            ...(details.location ? [["Location", details.location]] : []),
            ...(details.linkedinUrl ? [["LinkedIn", details.linkedinUrl]] : []),
            ["CV", sendSaved ? `${savedCv.name} (saved CV)` : cv ? `${cv.name} (${kb(cv.size)})` : "—"],
            ...questions.map((q) => {
              const a = answers[q.id];
              const shown = Array.isArray(a) ? a.join(", ") : a === "yes" ? "Yes" : a === "no" ? "No" : a;
              return [q.label, shown || "Not answered"];
            }),
          ].map(([term, value]) => (
            <div key={term} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
              <dt className="text-sm text-muted">{term}</dt>
              <dd className="break-words text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={() => goTo(0)} className="text-sm font-medium text-link hover:underline">
          Change something
        </button>
        <div>
          <label className="flex items-start gap-3 text-sm">
            <input
              {...field("consent")}
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]"
            />
            <span>
              I agree that Career Reads shares my details, CV and answers with {company} for this job, as described in the{" "}
              <Link href="/privacy-policy#job-applications" target="_blank" className="text-link underline-offset-2 hover:underline">
                privacy policy
              </Link>
              . Applications are deleted 6 months after the job closes.
            </span>
          </label>
          <FieldError id={`${id}-consent-error`} errors={err("consent")} />
        </div>
        <label className="flex items-center gap-3 text-sm text-muted">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
          Remember my contact details on this device for next time
        </label>
      </div>

      {message && (
        <p role="alert" className="mt-5 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {message}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => goTo(step - 1)} className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-5 font-semibold hover:bg-surface">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-2 px-7 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110 disabled:opacity-70"
        >
          {step < reviewStep ? (
            <>
              Next <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          ) : pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden /> Send application
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/** One screening question, with the right input for its kind. */
function QuestionField({
  question: q,
  value,
  error,
  baseId,
  onChange,
}: {
  question: FormQuestion;
  value: string | string[] | undefined;
  error?: string;
  baseId: string;
  onChange: (value: string | string[]) => void;
}) {
  const described = [q.helpText && `${baseId}-help`, error && `${baseId}-error`].filter(Boolean).join(" ") || undefined;
  const common = { "aria-invalid": error ? true : undefined, "aria-describedby": described };
  const heading = (
    <>
      {q.label} {!q.required && <span className="font-normal text-muted">(optional)</span>}
    </>
  );
  const help = q.helpText && (
    <p id={`${baseId}-help`} className="mb-2 text-sm text-muted">
      {q.helpText}
    </p>
  );

  if (q.kind === "yes_no" || q.kind === "single_choice" || q.kind === "multi_choice") {
    const options = q.kind === "yes_no" ? ["yes", "no"] : q.options;
    const multi = q.kind === "multi_choice";
    const picked = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <fieldset {...common}>
        <legend className="mb-1.5 text-sm font-medium">{heading}</legend>
        {help}
        <div className={cn("grid gap-2", q.kind === "yes_no" ? "grid-cols-2 sm:max-w-xs" : "sm:grid-cols-2")}>
          {options.map((option) => {
            const checked = picked.includes(option);
            return (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition hover:bg-surface",
                  checked ? "border-brand bg-brand/5" : error ? "border-rose-500" : "border-border",
                )}
              >
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={`q-${q.id}`}
                  checked={checked}
                  onChange={() => onChange(multi ? (checked ? picked.filter((p) => p !== option) : [...picked, option]) : option)}
                  className="h-4 w-4 accent-[var(--color-brand)]"
                />
                {q.kind === "yes_no" ? (option === "yes" ? "Yes" : "No") : option}
              </label>
            );
          })}
        </div>
        {error && (
          <p id={`${baseId}-error`} className="mt-1.5 flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400">
            <X className="h-3.5 w-3.5" aria-hidden /> {error}
          </p>
        )}
      </fieldset>
    );
  }

  const shared = { id: baseId, ...common, value: typeof value === "string" ? value : "", className: inputClass };
  return (
    <div>
      <label htmlFor={baseId} className="mb-1.5 block text-sm font-medium">
        {heading}
      </label>
      {help}
      {q.kind === "long_text" ? (
        <textarea {...shared} rows={4} maxLength={3000} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, "resize-y")} />
      ) : (
        <input
          {...shared}
          type={q.kind === "number" ? "text" : q.kind === "url" ? "url" : "text"}
          inputMode={q.kind === "number" ? "decimal" : q.kind === "url" ? "url" : undefined}
          maxLength={q.kind === "url" ? 500 : 300}
          placeholder={q.kind === "url" ? "https://" : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && (
        <p id={`${baseId}-error`} className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

/** "Didn't get it?" for the confirmation email. */
function ResendLink() {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  return (
    <p className="mt-3 text-sm">
      Didn&apos;t get it? Check your spam folder, or{" "}
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setNote((await resendConfirmation()).message ?? null))}
        className="font-semibold text-link underline-offset-2 hover:underline disabled:opacity-60"
      >
        {pending ? "sending…" : "send it again"}
      </button>
      .{note && <span className="mt-2 block text-muted">{note}</span>}
    </p>
  );
}
