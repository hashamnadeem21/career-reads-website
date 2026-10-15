import type { Metadata } from "next";
import { ConfirmEmail } from "@/components/account/ConfirmEmail";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Confirm your email"),
  robots: { index: false, follow: false },
  // The token is in the address: don't pass it on to other sites.
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<{ token?: string }> };

/** The link in the welcome email lands here. Confirming takes a button press, so email scanners that open links can't use it up. */
export default async function ConfirmEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <div className="container-page max-w-xl py-12 sm:py-16">
      <div className="rounded-2xl border border-border bg-background p-6 text-center sm:p-10">
        <ConfirmEmail token={typeof token === "string" ? token : ""} />
      </div>
    </div>
  );
}
