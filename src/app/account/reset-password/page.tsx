import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Choose a new password"),
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <div className="container-page max-w-xl py-12 sm:py-16">
      <h1 className="text-center text-3xl font-bold tracking-tight">Choose a new password</h1>
      <div className="mt-8 rounded-2xl border border-border bg-background p-5 sm:p-8">
        <ResetPasswordForm token={typeof token === "string" ? token : ""} />
      </div>
    </div>
  );
}
