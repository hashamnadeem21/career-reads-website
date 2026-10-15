"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useId } from "react";
import { resetPassword } from "@/app/account/actions";
import { FieldError } from "@/components/forms/SpamGuardFields";
import { announceAccountChange, keepValues, PasswordInput, primaryButton, thenOnSuccess } from "./AuthPanel";

export function ResetPasswordForm({ token }: { token: string }) {
  const id = useId();
  const router = useRouter();
  const [state, action, pending] = useActionState(
    thenOnSuccess(resetPassword, () => {
      announceAccountChange();
      router.replace("/account?reset=1");
    }),
    null,
  );
  const errors = (state?.status === "error" && state.fieldErrors) || {};

  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) {
    return (
      <p role="alert" className="text-center">
        This link is incomplete.{" "}
        <Link href="/account/sign-in?mode=signin" className="font-medium text-link hover:underline">
          Ask for a new one
        </Link>
        .
      </p>
    );
  }

  const field = (name: string) => ({
    id: `${id}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
  });

  return (
    <form onSubmit={keepValues(action)} noValidate className="space-y-4" data-testid="reset-form">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor={`${id}-password`} className="mb-1.5 block text-sm font-medium">
          New password
        </label>
        <PasswordInput {...field("password")} autoComplete="new-password" required minLength={8} maxLength={128} />
        {errors.password ? (
          <FieldError id={`${id}-password-error`} errors={[errors.password]} />
        ) : (
          <p className="mt-1.5 text-sm text-muted">At least 8 characters.</p>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-confirmPassword`} className="mb-1.5 block text-sm font-medium">
          Confirm new password
        </label>
        <PasswordInput {...field("confirmPassword")} autoComplete="new-password" required maxLength={128} />
        <FieldError id={`${id}-confirmPassword-error`} errors={errors.confirmPassword ? [errors.confirmPassword] : undefined} />
      </div>
      {state?.status === "error" && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {state.message}{" "}
          {!state.fieldErrors && (
            <Link href="/account/sign-in?mode=signin" className="font-medium underline">
              Ask for a new link
            </Link>
          )}
        </p>
      )}
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Save password and sign in
      </button>
    </form>
  );
}
