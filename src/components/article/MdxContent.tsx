import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import type { MDXComponents } from "next-mdx-remote-client/rsc";
import type { ComponentProps, ReactNode } from "react";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { AdSlot } from "@/components/ads/AdSlot";
import { remarkSafeMdx } from "@/lib/content/safe-mdx";
import type { ArticleImage } from "@/lib/content/schema";
import { injectArticleImages, injectInArticleAd } from "@/lib/content/toc";
import { cn, formatDate } from "@/lib/utils";

const calloutStyles = {
  info: { Icon: Info, className: "border-sky-500/30 bg-sky-500/5", icon: "text-sky-600 dark:text-sky-400" },
  tip: { Icon: Lightbulb, className: "border-brand/30 bg-brand/5", icon: "text-link" },
  warning: { Icon: TriangleAlert, className: "border-amber-500/40 bg-amber-500/5", icon: "text-amber-600 dark:text-amber-400" },
} as const;

function Callout({ type = "info", title, children }: { type?: keyof typeof calloutStyles; title?: string; children: ReactNode }) {
  const { Icon, className, icon } = calloutStyles[type] ?? calloutStyles.info;
  return (
    <div role="note" className={cn("not-prose my-8 flex gap-3 rounded-2xl border p-5", className)}>
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", icon)} aria-hidden />
      <div className="text-[0.95rem] leading-relaxed [&_p]:m-0">
        {title && <p className="mb-1 font-semibold text-foreground">{title}</p>}
        <div className="text-foreground/90">{children}</div>
      </div>
    </div>
  );
}

/** Use in MDX at the end of an article: <Correction date="2026-10-01">We previously said…</Correction> */
function Correction({ date, children }: { date: string; children: ReactNode }) {
  return (
    <aside className="not-prose my-8 rounded-2xl border border-border bg-surface p-5 text-sm">
      <p className="font-semibold">
        Correction{" "}
        <time dateTime={date} className="font-normal text-muted">
          ({formatDate(date)})
        </time>
      </p>
      <div className="mt-1 text-muted [&_p]:m-0">{children}</div>
    </aside>
  );
}

function SmartLink({ href = "", children, ...rest }: ComponentProps<"a">) {
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

/** Use in MDX: <Figure src="/images/x.jpg" alt="…" width={1600} height={900} caption="…" /> */
function Figure({ src, alt, width, height, caption }: { src: string; alt: string; width: number; height: number; caption?: string }) {
  return (
    <figure className="not-prose my-10">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 768px) 720px, 100vw"
        className="h-auto w-full rounded-2xl"
      />
      {caption && <figcaption className="mt-3 text-center text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

function buildComponents(adsEnabled: boolean, images: ArticleImage[]): MDXComponents {
  return {
    a: SmartLink,
    Callout,
    Correction,
    Figure,
    /** Placed automatically from the article's `images` list (see injectArticleImages). */
    ArticleImage: ({ index }: { index: number }) => {
      const image = images[index];
      return image ? <Figure {...image} /> : null;
    },
    InArticleAd: () => (adsEnabled ? <AdSlot placement="in-article" /> : null),
    // Never let content override the page's single H1.
    h1: (props: ComponentProps<"h2">) => <h2 {...props} />,
  };
}

export async function MdxContent({
  source,
  adsEnabled,
  images = [],
}: {
  source: string;
  adsEnabled: boolean;
  images?: ArticleImage[];
}) {
  const withImages = injectArticleImages(source, images);
  const prepared = adsEnabled ? injectInArticleAd(withImages) : withImages;
  return (
    <MDXRemote
      source={prepared}
      components={buildComponents(adsEnabled, images)}
      options={{
        disableImports: true,
        disableExports: true,
        // remarkSafeMdx strips {expressions}, unknown components and event handlers (content comes from the admin panel).
        mdxOptions: { remarkPlugins: [remarkGfm, [remarkSafeMdx, { mode: "strip" }]], rehypePlugins: [rehypeSlug] },
      }}
    />
  );
}
