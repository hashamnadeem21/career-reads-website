"use client";

import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useId } from "react";
import { subscribeToNewsletter } from "@/app/actions";
import { initialFormState } from "@/lib/forms/form-state";
import { cn } from "@/lib/utils";
import { FieldError, SpamGuardFields, useTimedAction } from "./SpamGuardFields";

export function NewsletterForm({ variant = "default" }: { variant?: "default" | "inverted" }) {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialFormState);
  const timedAction = useTimedAction(formAction);
  const id = useId();
  const emailError = state.fieldErrors?.email;
  const consentError = state.fieldErrors?.consent;
  const inverted = variant === "inverted";

  if (state.status === "success") {
    return (
      <p role="status" className={cn("flex items-center gap-2 font-medium", inverted ? "text-white" : "text-link")}>
        <CheckCircle2 className="h-5 w-5" aria-hidden /> {state.message}
      </p>
    );
  }

  return (
    <form action={timedAction} noValidate className="relative w-full" data-testid="newsletter-form">
      <SpamGuardFields />
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? `${id}-email-error` : undefined}
          className={cn(
            "h-12 w-full min-w-0 flex-1 rounded-full border px-5 text-base outline-none transition focus-visible:ring-2",
            inverted
              ? "border-white/30 bg-white/10 text-white placeholder:text-white/70 focus-visible:ring-white/70"
              : "border-border bg-background text-foreground placeholder:text-muted focus-visible:ring-brand",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 font-semibold transition disabled:opacity-70",
            inverted
              ? "bg-white text-blue-700 hover:bg-blue-50"
              : "bg-gradient-to-r from-brand to-brand-2 text-white shadow-lg shadow-blue-500/25 hover:brightness-110",
          )}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Subscribe
          {!pending && <ArrowRight className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      <FieldError id={`${id}-email-error`} errors={emailError} />
      <label className={cn("mt-3 flex items-start gap-2 text-sm", inverted ? "text-white/85" : "text-muted")}>
        <input
          type="checkbox"
          name="consent"
          className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
          aria-invalid={consentError ? true : undefined}
        />
        <span>
          Send me the Career Reads newsletter. Unsubscribe anytime. See our{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </span>
      </label>
      <FieldError id={`${id}-consent-error`} errors={consentError} />
      {state.status === "error" && !emailError && !consentError && (
        <p role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-300">
          {state.message}
        </p>
      )}
    </form>
  );
}
