import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { Crumb } from "@/lib/jsonld";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={id} className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
        {description && <p className="mt-3 text-base text-muted">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-link"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export interface HeroFact {
  icon?: LucideIcon;
  label: ReactNode;
}

/**
 * The hero at the top of listing and info pages: breadcrumb trail, eyebrow, one H1, then either
 * a plain lead or an "In short" answer (a quotable, self-contained summary for search and AI answers),
 * and a row of facts (counts, last updated) so readers and crawlers can see the page is current.
 */
export function PageHeader({
  eyebrow,
  title,
  highlight,
  description,
  summary,
  crumbs,
  facts,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** A word or phrase inside `title` to show in the brand gradient. */
  highlight?: string;
  description?: string;
  /** Replaces `description` on screen with an "In short" answer block. */
  summary?: string;
  crumbs?: Crumb[];
  facts?: HeroFact[];
  children?: ReactNode;
}) {
  const at = highlight ? title.indexOf(highlight) : -1;
  const heading =
    at >= 0 ? (
      <>
        {title.slice(0, at)}
        <span className="text-gradient">{highlight}</span>
        {title.slice(at + highlight!.length)}
      </>
    ) : (
      title
    );

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_20%_10%,black,transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-brand/25 to-brand-2/25 blur-3xl"
      />
      <div className="container-page relative py-10 sm:py-14 lg:py-16">
        {crumbs && (
          <div className="mb-8">
            <Breadcrumbs items={crumbs} />
          </div>
        )}
        {eyebrow && <p className="animate-rise eyebrow mb-3">{eyebrow}</p>}
        <h1
          className="animate-rise max-w-4xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]"
          style={{ animationDelay: "60ms" }}
        >
          {heading}
        </h1>
        {summary ? (
          <div className="animate-rise mt-6 max-w-2xl border-l-4 border-brand pl-5" style={{ animationDelay: "120ms" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">In short</p>
            <p className="mt-2 text-lg leading-relaxed">{summary}</p>
          </div>
        ) : (
          description && (
            <p className="animate-rise mt-5 max-w-2xl text-lg leading-relaxed text-muted" style={{ animationDelay: "120ms" }}>
              {description}
            </p>
          )
        )}
        {facts && facts.length > 0 && (
          <ul className="animate-rise mt-7 flex flex-wrap gap-2" style={{ animationDelay: "180ms" }}>
            {facts.map((fact, i) => (
              <li
                key={i}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-sm text-muted backdrop-blur"
              >
                {fact.icon && <fact.icon className="h-4 w-4 text-link" aria-hidden />}
                {fact.label}
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </section>
  );
}
