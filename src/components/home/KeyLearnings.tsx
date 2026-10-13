import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { categories } from "@/lib/categories";
import type { ArticleSummary } from "@/lib/content";

/**
 * The guide's core claim: the first sentence of its excerpt, plus the second
 * when the first is only a short hook ("Skip the spec-sheet overwhelm.").
 */
export function learningFrom(excerpt: string): string {
  // A sentence ends at . ! or ? followed by a capital, so "5 a.m. extremes" stays whole.
  const [first, second] = excerpt.trim().split(/(?<=[.!?])\s+(?=[A-Z"“])/);
  return first.split(/\s+/).length < 8 && second ? `${first} ${second}` : first;
}

export function KeyLearnings({ articles }: { articles: ArticleSummary[] }) {
  return (
    <ol className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, i) => (
        <li key={article.slug} className="group relative flex flex-col bg-background p-6 transition-colors hover:bg-surface sm:p-7">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em]">
            <span className="tabular-nums text-link">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-muted">{categories[article.category].name}</span>
          </div>
          <p className="mt-5 flex-1 font-display text-lg font-medium leading-snug text-balance">
            {learningFrom(article.excerpt)}
          </p>
          <Link
            href={`/blog/${article.slug}`}
            className="mt-6 inline-flex items-start gap-1.5 text-sm text-muted after:absolute after:inset-0 group-hover:text-link"
          >
            <span>
              From <span className="font-semibold text-foreground group-hover:text-link">{article.title}</span>
            </span>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </li>
      ))}
    </ol>
  );
}
