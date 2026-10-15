"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef } from "react";
import { submitCompanyRequest } from "@/app/employers/actions";
import { FieldError, SpamGuardFields, useTimedAction } from "@/components/forms/SpamGuardFields";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/employers/options";
import { initialFormState } from "@/lib/forms/form-state";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 aria-[invalid=true]:border-rose-500";

type FormContext = { id: string; errors: Record<string, string[] | undefined>; values: Record<string, string> };

type FieldProps = {
  form: FormContext;
  name: string;
  label: string;
  optional?: boolean;
  hint?: string;
  children: (props: { id: string; name: string; "aria-invalid"?: true; "aria-describedby"?: string; defaultValue?: string }) => React.ReactNode;
};

/** The "For employers" form: the company, the person asking, and what they hire for. */
export function CompanyRequestForm() {
  const [state, formAction, pending] = useActionState(submitCompanyRequest, initialFormState);
  const timedAction = useTimedAction(formAction);
  const id = useId();
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  const sentRef = useRef<HTMLDivElement>(null);

  // The confirmation is much shorter than the form: bring it into view.
  useEffect(() => {
    if (state.status === "success") sentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div ref={sentRef} role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8" data-testid="company-request-sent">
        <p className="flex items-center gap-2 text-lg font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-6 w-6" aria-hidden /> Request sent
        </p>
        <p className="mt-3 leading-relaxed">{state.message}</p>
        <p className="mt-3 text-sm text-muted">
          When it&apos;s approved, you&apos;ll get an email with a link to set your password and open your company dashboard.
        </p>
      </div>
    );
  }

  const form: FormContext = { id, errors, values };

  return (
    <form action={timedAction} noValidate className="relative space-y-8" data-testid="company-request-form">
      <SpamGuardFields />
      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {state.message}
        </p>
      )}

      <fieldset className="space-y-5">
        <legend className="mb-4 text-lg font-semibold">About your company</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field form={form} name="companyName" label="Company name">
            {(p) => <input {...p} type="text" autoComplete="organization" className={inputClass} />}
          </Field>
          <Field form={form} name="website" label="Website" optional>
            {(p) => <input {...p} type="url" inputMode="url" placeholder="https://company.com" className={inputClass} />}
          </Field>
          <Field form={form} name="industry" label="Industry">
            {(p) => (
              <select {...p} defaultValue={p.defaultValue ?? ""} className={inputClass}>
                <option value="" disabled>
                  Choose one
                </option>
                {INDUSTRIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            )}
          </Field>
          <Field form={form} name="companySize" label="Company size">
            {(p) => (
              <select {...p} defaultValue={p.defaultValue ?? ""} className={inputClass}>
                <option value="" disabled>
                  Choose one
                </option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field form={form} name="location" label="Location" hint="The city and country you hire in most, like Lahore, Pakistan.">
          {(p) => <input {...p} type="text" autoComplete="address-level2" className={inputClass} />}
        </Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-4 text-lg font-semibold">About you</legend>
        <p className="-mt-2 text-sm text-muted">You&apos;ll get the company&apos;s first admin account, and can ask us to add colleagues later.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field form={form} name="contactName" label="Full name">
            {(p) => <input {...p} type="text" autoComplete="name" className={inputClass} />}
          </Field>
          <Field form={form} name="contactRole" label="Job title">
            {(p) => <input {...p} type="text" autoComplete="organization-title" placeholder="HR Manager" className={inputClass} />}
          </Field>
          <Field form={form} name="contactEmail" label="Work email" hint="Your company email helps us approve you faster.">
            {(p) => <input {...p} type="email" autoComplete="email" className={inputClass} />}
          </Field>
          <Field form={form} name="contactPhone" label="Phone">
            {(p) => <input {...p} type="tel" autoComplete="tel" placeholder="+92 300 1234567" className={inputClass} />}
          </Field>
        </div>
        <Field form={form} name="hiringPlans" label="What are you hiring for?" optional>
          {(p) => <textarea {...p} rows={4} placeholder="The roles you'd like to post, and roughly how many." className={inputClass} />}
        </Field>
      </fieldset>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            name="consent"
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${id}-consent-error` : undefined}
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-link hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="text-link hover:underline">
              Privacy Policy
            </Link>
            , and confirm I&apos;m allowed to hire for this company.
          </span>
        </label>
        <FieldError id={`${id}-consent-error`} errors={errors.consent} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-8 font-semibold text-white transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />}
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}

/** A labelled control with its hint and error, wired up for screen readers. */
function Field({ form, name, label, optional, hint, children }: FieldProps) {
  const fieldId = `${form.id}-${name}`;
  const error = form.errors[name];
  const described = [hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children({ id: fieldId, name, "aria-invalid": error ? true : undefined, "aria-describedby": described, defaultValue: form.values[name] })}
      {hint && (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${fieldId}-error`} errors={error} />
    </div>
  );
}
