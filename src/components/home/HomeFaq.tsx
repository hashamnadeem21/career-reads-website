import { ArrowRight, Briefcase, BookOpen, MessageCircleQuestion, Plus, Search } from "lucide-react";
import Link from "next/link";
import type { FaqItem } from "@/lib/jsonld";

export interface HomeFaqItem extends FaqItem {
  group: "jobs" | "site";
  link?: { href: string; label: string };
}

const groups = [
  { key: "jobs", title: "Jobs and applying", icon: Briefcase },
  { key: "site", title: "Guides and the site", icon: BookOpen },
] as const;

function Answer({ item }: { item: HomeFaqItem }) {
  return (
    <>
      <p className="leading-relaxed text-muted">{item.answer}</p>
      {item.link && (
        <Link href={item.link.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
          {item.link.label}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </>
  );
}

/**
 * The first item is shown open as the headline answer; the rest are grouped
 * accordions built on <details>, so every answer is in the HTML without JavaScript.
 */
export function HomeFaq({ items }: { items: HomeFaqItem[] }) {
  const [headline, ...others] = items;
  const rest = others.map((item, i) => ({ item, n: i + 2 }));

  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-strong text-link" aria-hidden>
          <MessageCircleQuestion className="h-6 w-6" />
        </span>
        <p className="eyebrow mt-4">FAQ</p>
        <h2 id="faq" className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-3 text-muted">Straight answers about finding jobs and using our guides.</p>
      </div>

      {headline && (
        <div className="relative mt-14 overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-surface-strong to-background p-7 sm:p-10">
          <span aria-hidden className="absolute -right-6 -top-10 font-display text-[10rem] font-bold leading-none text-brand/10">
            ?
          </span>
          <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-link">The short answer</p>
          <h3 className="relative mt-2 font-display text-2xl font-semibold tracking-tight">{headline.question}</h3>
          <div className="relative mt-3 max-w-3xl text-lg">
            <Answer item={headline} />
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {groups.map(({ key, title, icon: Icon }) => (
          <div key={key} className="rounded-3xl border border-border bg-surface p-4 sm:p-6">
            <h3 className="flex items-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
              <Icon className="h-4 w-4 text-link" aria-hidden />
              {title}
            </h3>
            <ul className="mt-3 space-y-3">
              {rest
                .filter(({ item }) => item.group === key)
                .map(({ item, n }) => {
                  return (
                    <li key={item.question}>
                      <details className="group rounded-2xl border border-transparent bg-background transition-colors open:border-brand/40 open:shadow-lg open:shadow-blue-500/5 hover:border-border">
                        <summary className="flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
                          <span
                            aria-hidden
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-strong text-xs font-semibold tabular-nums text-link group-open:bg-brand group-open:text-white"
                          >
                            {String(n).padStart(2, "0")}
                          </span>
                          <h4 className="flex-1 font-semibold leading-snug">{item.question}</h4>
                          <Plus className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-45 group-open:text-link" aria-hidden />
                        </summary>
                        <div className="px-5 pb-6 pl-[4.25rem]">
                          <Answer item={item} />
                        </div>
                      </details>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl bg-navy p-7 text-white ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="font-display text-xl font-semibold">Didn&apos;t find your answer?</p>
          <p className="mt-1 text-sm text-white/70">Search the guides, or ask the editors directly.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/search" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
            <Search className="h-4 w-4" aria-hidden />
            Search guides
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-white/90">
            Contact the editors
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
