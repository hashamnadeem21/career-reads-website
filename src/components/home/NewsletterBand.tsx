import { Mailbox } from "lucide-react";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export function NewsletterBand() {
  return (
    <section aria-labelledby="newsletter-heading" className="container-page">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#0284C7] px-6 py-12 text-white sm:px-12 sm:py-16">
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#0F172A]/20 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Mailbox className="h-6 w-6" aria-hidden />
            </span>
            <h2 id="newsletter-heading" className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              One thoughtful email a week
            </h2>
            <p className="mt-3 max-w-md text-white/85">
              New guides on technology, AI tools, productivity, and living well — plus one idea worth trying. No spam,
              and you can unsubscribe in one click.
            </p>
          </div>
          <NewsletterForm variant="inverted" />
        </div>
      </div>
    </section>
  );
}
