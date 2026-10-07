import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/ui/StaticPage";
import { categoryList } from "@/lib/categories";
import { ensureSiteData } from "@/lib/site-data";
import { getAuthors } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const description =
  "Learn who writes Career Reads, what we cover, how we research and edit our guides, and how we keep the site independent.";

export const metadata: Metadata = buildMetadata({ title: "About Career Reads", description, path: "/about" });

export default async function AboutPage() {
  await ensureSiteData();
  const authors = await getAuthors();
  return (
    <StaticPage eyebrow="About us" title="About Career Reads" description={description} path="/about">
      <p>
        {siteConfig.name} is an independent publication of practical, carefully edited guides. We write for curious
        people who want clear explanations and useful next steps — not hype, not filler.
      </p>

      <h2>What we cover</h2>
      <ul>
        {categoryList.map((c) => (
          <li key={c.slug}>
            <Link href={`/category/${c.slug}`}>{c.name}</Link> — {c.description}
          </li>
        ))}
      </ul>

      <h2>How we work</h2>
      <p>
        Every article is researched against primary sources where possible, edited for clarity and accuracy, and
        reviewed again when the facts change. We show both the original publication date and the date of any
        significant update. Read our <Link href="/editorial-policy">editorial policy</Link> for the full process, and
        our <Link href="/corrections-policy">corrections policy</Link> for how we handle mistakes.
      </p>

      <h2>Who writes Career Reads</h2>
      <ul>
        {authors.map((a) => (
          <li key={a.slug}>
            <Link href={`/authors/${a.slug}`}>{a.name}</Link> — {a.role}
          </li>
        ))}
      </ul>

      <h2>How we&apos;re funded</h2>
      <p>
        Career Reads may display advertising to support the site. Advertisers never influence our editorial decisions,
        and ads are always clearly labeled. See our <Link href="/advertising-disclosure">advertising disclosure</Link>{" "}
        for details.
      </p>

      <h2>Get in touch</h2>
      <p>
        Questions, feedback, or story ideas? <Link href="/contact">Contact the editors</Link> or email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    </StaticPage>
  );
}
