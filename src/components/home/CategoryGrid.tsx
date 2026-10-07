import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { categoryList } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryGrid({ counts }: { counts: Record<string, number> }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categoryList.map((category, i) => (
        <Reveal as="li" key={category.slug} delay={(i % 3) * 0.05}>
          <Link
            href={`/category/${category.slug}`}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background p-6 transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg hover:shadow-blue-500/10"
          >
            <span
              aria-hidden
              className={cn(
                "absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40",
                category.accent,
              )}
            />
            <span className={cn("h-1.5 w-12 rounded-full bg-gradient-to-r", category.accent)} aria-hidden />
            <h3 className="mt-5 flex items-center justify-between font-display text-xl font-semibold">
              {category.name}
              <ArrowUpRight className="h-5 w-5 text-muted transition group-hover:rotate-45 group-hover:text-link" aria-hidden />
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{category.description}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-link">
              {counts[category.slug] ?? 0} {counts[category.slug] === 1 ? "article" : "articles"}
            </p>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}
