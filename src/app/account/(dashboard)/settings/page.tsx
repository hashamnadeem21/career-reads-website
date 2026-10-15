import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountDetails } from "@/components/account/AccountDetails";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { currentCandidate } from "@/lib/candidate/session";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Account settings"),
  robots: { index: false, follow: false },
};

/** Profile, email confirmation, newsletter, sign out and deleting the account. */
export default async function AccountSettingsPage() {
  const candidate = await currentCandidate();
  if (!candidate) redirect("/account/sign-in?mode=signin&next=/account/settings");

  return (
    <>
      <AccountPageHeader title="Account settings">Your sign-in, email and newsletter.</AccountPageHeader>
      <AccountDetails candidate={candidate} />
    </>
  );
}
