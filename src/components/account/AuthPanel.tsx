"use client";

import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, startTransition, useActionState, useCallback, useId, useState, useTransition } from "react";
import { createAccount, requestPasswordReset, signInWithGoogle, signInWithPassword } from "@/app/account/actions";
import { FieldError } from "@/components/forms/SpamGuardFields";
import type { AuthResult } from "@/lib/candidate/types";
import { cn } from "@/lib/utils";
import { GoogleButton } from "./GoogleButton";

export const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 aria-[invalid=true]:border-rose-500";
export const primaryButton =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-2 px-7 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110 disabled:opacity-70";

/** Tells the header's account menu to look again after signing in or out. */
export const ACCOUNT_CHANGED = "careerreads:account-changed";
export const announceAccountChange = () => window.dispatchEvent(new Event(ACCOUNT_CHANGED));

type Mode = "signup" | "signin" | "forgot";

/**
 * Sign in or create an account: Google, or name + email + password. Used on the apply page (to
 * apply on Career Reads) and on /account/sign-in. After signing in it goes to `next`.
 */
export function AuthPanel({
  next,
  initialMode = "signup",
  googleClientId,
}: {
  next: string;
  initialMode?: Mode;
  /** From the server at request time (see googleClientId() in lib/env). Unset: email and password only. */
  googleClientId?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googlePending, startGoogle] = useTransition();

  const done = useCallback(() => {
    announceAccountChange();
    router.replace(next, { scroll: false });
    router.refresh();
  }, [next, router]);

  const onGoogle = useCallback(
    (credential: string) =>
      startGoogle(async () => {
        setGoogleError(null);
        const result = await signInWithGoogle(credential);
        if (result.status === "success") done();
        else setGoogleError(result.message);
      }),
    [done],
  );

  return (
    <div className="mx-auto w-full max-w-md" data-testid="auth-panel">
      {mode !== "forgot" && (
        <>
          <div role="tablist" aria-label="Account" className="mb-6 grid grid-cols-2 rounded-full border border-border bg-surface p-1 text-sm font-semibold">
            {(["signup", "signin"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn("h-10 rounded-full transition", mode === m ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground")}
              >
                {m === "signup" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>
          <div className="relative">
            <GoogleButton clientId={googleClientId} onCredential={onGoogle} text={mode === "signup" ? "signup_with" : "signin_with"} />
            {googlePending && (
              <p role="status" className="mt-2 flex items-center justify-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Signing you in…
              </p>
            )}
            {googleError && (
              <p role="alert" className="mt-3 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                {googleError}
              </p>
            )}
          </div>
          {googleClientId && (
            <p className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted">
              <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
            </p>
          )}
        </>
      )}
      {mode === "signup" && <SignUpForm onDone={done} />}
      {mode === "signin" && <SignInForm onDone={done} onForgot={() => setMode("forgot")} />}
      {mode === "forgot" && <ForgotForm onBack={() => setMode("signin")} />}
    </div>
  );
}

function useFormHelpers(state: AuthResult | null) {
  const id = useId();
  const errors = (state?.status === "error" && state.fieldErrors) || {};
  const field = (name: string) => ({
    id: `${id}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
  });
  const error = (name: string) => <FieldError id={`${id}-${name}-error`} errors={errors[name] ? [errors[name]] : undefined} />;
  const label = (name: string, text: string) => (
    <label htmlFor={`${id}-${name}`} className="mb-1.5 block text-sm font-medium">
      {text}
    </label>
  );
  const alert = state?.status === "error" && (
    <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
      {state.message}
    </p>
  );
  return { field, error, label, alert, errors };
}

/**
 * Submits without React's automatic form reset (which follows a form `action`), so a typo in one
 * field doesn't wipe the others.
 */
export function keepValues(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  };
}

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={shown ? "text" : "password"} className={cn(inputClass, "pr-12")} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted hover:text-foreground"
      >
        {shown ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}

/**
 * Runs `onDone` as soon as the action succeeds. Not in an effect: setting the session cookie makes
 * Next re-render the page straight away, which can unmount the form before an effect would run.
 */
export function thenOnSuccess<T extends unknown[]>(action: (prev: AuthResult | null, ...args: T) => Promise<AuthResult>, onDone: () => void) {
  return async (prev: AuthResult | null, ...args: T) => {
    const result = await action(prev, ...args);
    if (result.status === "success") onDone();
    return result;
  };
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState(thenOnSuccess(createAccount, onDone), null);
  const { field, error, label, alert, errors } = useFormHelpers(state);
  return (
    <form onSubmit={keepValues(action)} noValidate className="space-y-4" data-testid="signup-form">
      <div>
        {label("name", "Full name")}
        <input {...field("name")} type="text" autoComplete="name" required maxLength={80} className={inputClass} />
        {error("name")}
      </div>
      <div>
        {label("email", "Email")}
        <input {...field("email")} type="email" autoComplete="email" inputMode="email" required className={inputClass} />
        {error("email")}
      </div>
      <div>
        {label("password", "Password")}
        <PasswordInput {...field("password")} autoComplete="new-password" required minLength={8} maxLength={128} />
        {errors.password ? error("password") : <p className="mt-1.5 text-sm text-muted">At least 8 characters.</p>}
      </div>
      <div>
        {label("confirmPassword", "Confirm password")}
        <PasswordInput {...field("confirmPassword")} autoComplete="new-password" required maxLength={128} />
        {error("confirmPassword")}
      </div>
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input {...field("acceptTerms")} type="checkbox" required className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]" />
          <span>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="text-link underline-offset-2 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy#candidate-accounts" target="_blank" className="text-link underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {error("acceptTerms")}
      </div>
      {alert}
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {pending ? "Creating your account…" : "Create account"}
      </button>
      <p className="text-center text-xs text-muted">We&apos;ll email you a link to confirm your address.</p>
    </form>
  );
}

function SignInForm({ onDone, onForgot }: { onDone: () => void; onForgot: () => void }) {
  const [state, action, pending] = useActionState(thenOnSuccess(signInWithPassword, onDone), null);
  const { field, error, label, alert } = useFormHelpers(state);
  return (
    <form onSubmit={keepValues(action)} noValidate className="space-y-4" data-testid="signin-form">
      <div>
        {label("email", "Email")}
        <input {...field("email")} type="email" autoComplete="email" inputMode="email" required className={inputClass} />
        {error("email")}
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          {label("password", "Password")}
          <button type="button" onClick={onForgot} className="mb-1.5 text-sm font-medium text-link hover:underline">
            Forgot password?
          </button>
        </div>
        <PasswordInput {...field("password")} autoComplete="current-password" required />
        {error("password")}
      </div>
      {alert}
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  const { field, error, label, alert } = useFormHelpers(state);
  return (
    <div>
      <h2 className="text-xl font-semibold">Forgot your password?</h2>
      {state?.status === "success" ? (
        <p role="status" className="mt-4 flex gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          {state.message}
        </p>
      ) : (
        <form onSubmit={keepValues(action)} noValidate className="mt-4 space-y-4" data-testid="forgot-form">
          <p className="text-sm text-muted">Enter your account&apos;s email and we&apos;ll send you a link to choose a new password.</p>
          <div>
            {label("email", "Email")}
            <input {...field("email")} type="email" autoComplete="email" inputMode="email" required className={inputClass} />
            {error("email")}
          </div>
          {alert}
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Email me a link
          </button>
        </form>
      )}
      <button type="button" onClick={onBack} className="mt-5 text-sm font-medium text-link hover:underline">
        Back to sign in
      </button>
    </div>
  );
}
