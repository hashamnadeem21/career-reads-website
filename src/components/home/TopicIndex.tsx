import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export interface TopicIndexEntry {
  href: string;
  name: string;
  count: number;
}

/** A plain, scannable index of hub pages — strong internal links with real counts. */
export function TopicIndex({
  id,
  title,
  unit,
  entries,
}: {
  id: string;
  title: string;
  unit: [singular: string, plural: string];
  entries: TopicIndexEntry[];
}) {
  return (
    <div>
      <h3 id={id} className="border-b-2 border-foreground pb-3 text-sm font-semibold uppercase tracking-[0.14em]">
        {title}
      </h3>
      <ul aria-labelledby={id} className="divide-y divide-border">
        {entries.map(({ href, name, count }) => (
          <li key={href}>
            <Link href={href} className="group flex items-center gap-3 py-3.5">
              <span className="font-medium group-hover:text-link">{name}</span>
              <span aria-hidden className="flex-1 border-b border-dotted border-border" />
              <span className="text-sm tabular-nums text-muted">
                {count} {count === 1 ? unit[0] : unit[1]}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:rotate-45 group-hover:text-link" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
