import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { MyApplications } from "@/components/account/MyApplications";
import { currentCandidate, myApplications } from "@/lib/candidate/session";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("My applications"),
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ reset?: string }> };

/** The dashboard's first tab: the jobs they've applied for, with the employer's status. */
export default async function MyApplicationsPage({ searchParams }: Props) {
  const [candidate, mine] = await Promise.all([currentCandidate(), myApplications()]);
  if (!candidate) redirect("/account/sign-in?mode=signin&next=/account");
  const { reset } = await searchParams;

  return (
    <>
      {reset && (
        <p role="status" className="mb-6 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Your new password is saved and you&apos;re signed in.
        </p>
      )}
      <AccountPageHeader title="My applications">Every job you&apos;ve applied for on Career Reads, and where it stands.</AccountPageHeader>
      {mine ? <MyApplications applications={mine.applications} /> : <LoadFailed />}
    </>
  );
}

function LoadFailed() {
  return (
    <p role="status" className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
      We couldn&apos;t load this just now. Please refresh the page in a minute.
    </p>
  );
}
