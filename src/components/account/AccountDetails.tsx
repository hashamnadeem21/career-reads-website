"use client";

import { BadgeCheck, Loader2, LogOut, MailWarning, Newspaper, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useId, useState, useTransition } from "react";
import { deleteAccount, resendConfirmation, signOut, subscribeToJobAlerts } from "@/app/account/actions";
import { FieldError } from "@/components/forms/SpamGuardFields";
import type { AuthResult, Candidate } from "@/lib/candidate/types";
import { announceAccountChange, inputClass, keepValues, thenOnSuccess } from "./AuthPanel";
import { Avatar } from "./Avatar";

const card = "mt-6 rounded-2xl border border-border bg-background p-5 sm:p-6";
const smallButton =
  "inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition hover:bg-surface disabled:opacity-60";

function Note({ result }: { result: AuthResult | null }) {
  if (!result?.message) return null;
  return (
    <p
      role={result.status === "error" ? "alert" : "status"}
      className={result.status === "error" ? "mt-3 text-sm text-rose-600 dark:text-rose-400" : "mt-3 text-sm text-emerald-700 dark:text-emerald-300"}
    >
      {result.message}
    </p>
  );
}

export function AccountDetails({ candidate }: { candidate: Candidate }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"resend" | "subscribe" | "signout" | null>(null);
  const [result, setResult] = useState<{ for: string; value: AuthResult } | null>(null);

  const run = (what: "resend" | "subscribe" | "signout", action: () => Promise<AuthResult>) =>
    start(async () => {
      setBusy(what);
      const value = await action();
      setBusy(null);
      setResult({ for: what, value });
      if (what === "signout" || (value.status === "error" && value.message === "Please sign in again.")) {
        announceAccountChange();
        router.replace("/");
        router.refresh();
      } else if (value.status === "success") {
        router.refresh();
      }
    });
  const spinner = (what: string) => pending && busy === what && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />;

  return (
    <>
      <section className={card} aria-label="Profile">
        <div className="flex items-center gap-4">
          <Avatar name={candidate.name} url={candidate.avatarUrl} size={56} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{candidate.name}</p>
            <p className="truncate text-muted">{candidate.email}</p>
            <p className="mt-1 text-sm text-muted">{candidate.signupMethod === "google" ? "Signs in with Google" : "Signs in with email and password"}</p>
          </div>
        </div>
      </section>

      <section className={card} aria-labelledby="email-status">
        <h2 id="email-status" className="flex items-center gap-2 font-semibold">
          {candidate.emailVerified ? (
            <>
              <BadgeCheck className="h-5 w-5 text-emerald-500" aria-hidden /> Email confirmed
            </>
          ) : (
            <>
              <MailWarning className="h-5 w-5 text-amber-500" aria-hidden /> Please confirm your email
            </>
          )}
        </h2>
        {candidate.emailVerified ? (
          <p className="mt-2 text-sm text-muted">Employers get your applications straight away.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              Open the link we emailed to {candidate.email}. Applications you send before then wait, and go to the employer as soon as you confirm.
            </p>
            <button type="button" className={`${smallButton} mt-4`} disabled={pending} onClick={() => run("resend", resendConfirmation)}>
              {spinner("resend")} Send the link again
            </button>
            {result?.for === "resend" && <Note result={result.value} />}
          </>
        )}
      </section>

      <section className={card} aria-labelledby="newsletter">
        <h2 id="newsletter" className="flex items-center gap-2 font-semibold">
          <Newspaper className="h-5 w-5 text-link" aria-hidden /> Newsletter
        </h2>
        {candidate.subscribed ? (
          <p className="mt-2 text-sm text-muted">You get the Career Reads newsletter. Every email has a link to unsubscribe.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">New jobs and career advice in your inbox. Unsubscribe any time.</p>
            <button type="button" className={`${smallButton} mt-4`} disabled={pending} onClick={() => run("subscribe", subscribeToJobAlerts)}>
              {spinner("subscribe")} Subscribe
            </button>
          </>
        )}
        {result?.for === "subscribe" && <Note result={result.value} />}
      </section>

      <section className={card} aria-label="Sign out">
        <button type="button" className={smallButton} disabled={pending} onClick={() => run("signout", signOut)}>
          {spinner("signout") || <LogOut className="h-4 w-4" aria-hidden />} Sign out
        </button>
      </section>

      <DeleteAccount />
    </>
  );
}

function DeleteAccount() {
  const id = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    thenOnSuccess(deleteAccount, () => {
      announceAccountChange();
      router.replace("/");
    }),
    null,
  );

  return (
    <section className={`${card} border-rose-500/30`} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-300">
        <Trash2 className="h-5 w-5" aria-hidden /> Delete my account
      </h2>
      <p className="mt-2 text-sm text-muted">
        Deletes your account, your applications and CVs, and your newsletter subscription. Employers can no longer see your applications. This can&apos;t be undone.
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-4 text-sm font-semibold text-rose-700 hover:underline dark:text-rose-300">
          Delete my account…
        </button>
      ) : (
        <form onSubmit={keepValues(action)} noValidate className="mt-4 space-y-3" data-testid="delete-account-form">
          <label htmlFor={`${id}-confirm`} className="block text-sm font-medium">
            Type DELETE to confirm
          </label>
          <input
            id={`${id}-confirm`}
            name="confirm"
            autoComplete="off"
            aria-invalid={state?.status === "error" ? true : undefined}
            aria-describedby={state?.status === "error" ? `${id}-confirm-error` : undefined}
            className={`${inputClass} max-w-xs`}
          />
          <FieldError id={`${id}-confirm-error`} errors={state?.status === "error" ? [state.message] : undefined} />
          <div className="flex gap-3">
            <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Delete everything
            </button>
            <button type="button" onClick={() => setOpen(false)} className={smallButton}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
