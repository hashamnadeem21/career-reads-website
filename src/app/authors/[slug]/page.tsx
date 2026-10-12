import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleGrid } from "@/components/article/ArticleGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getArticlesByAuthor, getAuthor, getAuthors } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getAuthors()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthor((await params).slug);
  if (!author) return {};
  return buildMetadata({
    title: `${author.name} — ${author.role}`,
    description: author.bio.slice(0, 160),
    path: `/authors/${author.slug}`,
  });
}

export default async function AuthorPage({ params }: Props) {
  const author = await getAuthor((await params).slug);
  if (!author) notFound();
  const articles = await getArticlesByAuthor(author.slug);
  const links = Object.values(author.links).filter(Boolean) as string[];

  return (
    <div className="container-page py-12">
      <Breadcrumbs items={[{ name: "Authors", path: "/about" }, { name: author.name, path: `/authors/${author.slug}` }]} />
      <header className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
        <Image src={author.avatar} alt="" width={112} height={112} className="h-28 w-28 rounded-full" priority />
        <div className="max-w-2xl">
          <p className="eyebrow">{author.role}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">{author.name}</h1>
          <p className="mt-3 leading-relaxed text-muted">{author.bio}</p>
        </div>
      </header>
      <section aria-labelledby="author-articles" className="mt-14">
        <h2 id="author-articles" className="mb-8 font-display text-2xl font-semibold">
          Articles by {author.name} ({articles.length})
        </h2>
        <ArticleGrid articles={articles} adAfter={6} />
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: absoluteUrl(`/authors/${author.slug}`),
          mainEntity: {
            "@type": author.type,
            name: author.name,
            description: author.bio,
            image: absoluteUrl(author.avatar),
            ...(links.length > 0 && { sameAs: links }),
          },
        }}
      />
    </div>
  );
}
