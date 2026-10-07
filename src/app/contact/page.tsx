import { Mail, MessageSquareText, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/ContactForm";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/SectionHeading";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { ensureSiteData } from "@/lib/site-data";

const description =
  "Contact the Career Reads editors with questions, feedback, corrections, or advertising and partnership enquiries.";

export const metadata: Metadata = buildMetadata({ title: "Contact us", description, path: "/contact" });

export default async function ContactPage() {
  await ensureSiteData();
  return (
    <>
      <PageHeader eyebrow="Get in touch" title="Contact us" description={description}>
        <div className="mt-8">
          <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
        </div>
      </PageHeader>
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          {[
            {
              Icon: PenLine,
              title: "Corrections",
              body: (
                <>
                  Found an error? Choose “Report an error” and include the article link. See our{" "}
                  <Link href="/corrections-policy" className="text-link hover:underline">
                    corrections policy
                  </Link>
                  .
                </>
              ),
            },
            {
              Icon: MessageSquareText,
              title: "Feedback & ideas",
              body: "We read every message, and reader questions often shape what we write next.",
            },
            {
              Icon: Mail,
              title: "Email",
              body: (
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-link hover:underline">
                  {siteConfig.contactEmail}
                </a>
              ),
            },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-border p-5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-strong text-link">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="mb-6 font-display text-2xl font-semibold">Send a message</h2>
          <ContactForm />
        </div>
      </div>
    </>
  );
}
