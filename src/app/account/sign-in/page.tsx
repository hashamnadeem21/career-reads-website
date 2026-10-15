import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/account/AuthPanel";
import { currentCandidate } from "@/lib/candidate/session";
import { googleClientId } from "@/lib/env";
import { safeNext } from "@/lib/candidate/types";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Sign in"),
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string; mode?: string }> };

/** Sign in or create an account. Browsing never needs one: only applying on Career Reads does. */
export default async function SignInPage({ searchParams }: Props) {
  const { next: rawNext, mode } = await searchParams;
  const next = safeNext(rawNext);
  if (await currentCandidate()) redirect(next);

  return (
    <div className="container-page max-w-xl py-12 sm:py-16">
      <h1 className="text-center text-3xl font-bold tracking-tight">{mode === "signin" ? "Welcome back" : "Your Career Reads account"}</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-muted">
        Apply for jobs on Career Reads in a few clicks. Reading articles and browsing jobs never needs an account.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-background p-5 sm:p-8">
        <AuthPanel next={next} initialMode={mode === "signin" ? "signin" : "signup"} googleClientId={googleClientId()} />
      </div>
    </div>
  );
}
