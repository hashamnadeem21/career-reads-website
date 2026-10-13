import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export interface GlanceStat {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  /** Short line under the label, e.g. "Work from anywhere". */
  hint: string;
}

const numberFormat = new Intl.NumberFormat("en-US");

/**
 * The homepage "At a glance" band: live counts from the same data the pages use, as glowing glass
 * cards on navy. Each card links to the matching list.
 */
export function AtAGlance({ stats, lastUpdated }: { stats: GlanceStat[]; lastUpdated?: string }) {
  return (
    <section aria-labelledby="at-a-glance" className="relative isolate overflow-hidden bg-navy text-white dark:bg-surface">
      {/* Backdrop: soft brand glows and a faint dot grid */}
      <div aria-hidden className="absolute -left-32 -top-40 -z-10 h-96 w-96 rounded-full bg-brand/35 blur-3xl" />
      <div aria-hidden className="absolute -bottom-48 right-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand-2/25 blur-3xl" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="container-page flex flex-col gap-8 py-14 sm:py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">At a glance</p>
            <h2 id="at-a-glance" className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight sm:whitespace-nowrap sm:text-3xl">
              Today&apos;s <span className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">jobs &amp; career guides</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Open jobs, remote roles, internships and practical career guides on Career Reads, updated daily.
            </p>
          </div>
          {lastUpdated && (
            <p className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 md:self-auto">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Updated <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
            </p>
          )}
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {stats.map(({ label, value, href, icon: Icon, hint }, i) => (
            <li
              key={label}
              className={`group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-sky-300/40 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-blue-500/20 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                i === stats.length - 1 && stats.length % 2 === 1 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2 shadow-lg shadow-blue-500/30" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-white/30 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sky-300"
                  aria-hidden
                />
              </div>
              <p className="mt-5 bg-gradient-to-b from-white to-sky-200 bg-clip-text font-display text-4xl font-bold tabular-nums tracking-tight text-transparent">
                {numberFormat.format(value)}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-sky-300">
                  {label}
                </Link>
              </p>
              <p className="mt-0.5 text-xs text-white/55">{hint}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
