"use client";

import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { confirmEmail } from "@/app/account/actions";
import type { AuthResult } from "@/lib/candidate/types";
import { announceAccountChange, primaryButton } from "./AuthPanel";

export function ConfirmEmail({ token }: { token: string }) {
  const [result, setResult] = useState<AuthResult | null>(null);
  const [pending, start] = useTransition();
  const valid = /^[A-Za-z0-9_-]{20,200}$/.test(token);

  if (!valid || result?.status === "error") {
    return (
      <div role={result ? "alert" : undefined}>
        <XCircle className="mx-auto h-12 w-12 text-rose-500" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">This link doesn&apos;t work</h1>
        <p className="mt-3 text-muted">
          {result?.status === "error" ? result.message : "The link is incomplete."} You can get a new link from your account page.
        </p>
        <Link href="/account" className={`${primaryButton} mt-6 sm:w-auto`}>
          Go to my account
        </Link>
      </div>
    );
  }

  if (result?.status === "success") {
    return (
      <div role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">Your email is confirmed</h1>
        <p className="mt-3 text-muted">Thanks! Any application you sent while we waited has now gone to the employer.</p>
        <Link href="/jobs" className={`${primaryButton} mt-6 sm:w-auto`}>
          Find your next job
        </Link>
      </div>
    );
  }

  return (
    <div>
      <MailCheck className="mx-auto h-12 w-12 text-link" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold">Confirm your email</h1>
      <p className="mt-3 text-muted">One click and your Career Reads account is ready.</p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await confirmEmail(token);
            setResult(res);
            if (res.status === "success") announceAccountChange();
          })
        }
        className={`${primaryButton} mt-6 sm:w-auto`}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Confirm my email
      </button>
    </div>
  );
}
