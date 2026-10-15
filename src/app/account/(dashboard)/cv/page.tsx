import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { MyCv } from "@/components/account/MyCv";
import { currentCandidate, myApplications } from "@/lib/candidate/session";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("My CV"),
  robots: { index: false, follow: false },
};

/** The CV saved on their account, used when they apply. */
export default async function MyCvPage() {
  const [candidate, mine] = await Promise.all([currentCandidate(), myApplications()]);
  if (!candidate) redirect("/account/sign-in?mode=signin&next=/account/cv");

  return (
    <>
      <AccountPageHeader title="My CV">Keep your latest CV here and apply for jobs without uploading it each time.</AccountPageHeader>
      {mine ? (
        <MyCv cv={mine.cv} />
      ) : (
        <p role="status" className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          We couldn&apos;t load your CV just now. Please refresh the page in a minute.
        </p>
      )}
    </>
  );
}
