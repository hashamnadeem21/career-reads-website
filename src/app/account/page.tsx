import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountDetails } from "@/components/account/AccountDetails";
import { MyApplications } from "@/components/account/MyApplications";
import { MyCv } from "@/components/account/MyCv";
import { currentCandidate, myApplications } from "@/lib/candidate/session";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("My account"),
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ reset?: string }> };

/** Their applications with the employer's status, their saved CV, then account settings. */
export default async function AccountPage({ searchParams }: Props) {
  const [candidate, mine] = await Promise.all([currentCandidate(), myApplications()]);
  if (!candidate) redirect("/account/sign-in?mode=signin&next=/account");
  const { reset } = await searchParams;

  return (
    <div className="container-page max-w-2xl py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight">My account</h1>
      {reset && (
        <p role="status" className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Your new password is saved and you&apos;re signed in.
        </p>
      )}
      {mine ? (
        <>
          <MyApplications applications={mine.applications} />
          <MyCv cv={mine.cv} />
        </>
      ) : (
        <p role="status" className="mt-6 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          We couldn&apos;t load your applications just now. Please refresh the page in a minute.
        </p>
      )}
      <h2 className="mt-10 text-xl font-semibold">Account settings</h2>
      <AccountDetails candidate={candidate} />
    </div>
  );
}
