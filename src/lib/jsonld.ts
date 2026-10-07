import { categories } from "@/lib/categories";
import type { Article, Author } from "@/lib/content";
import type { Job } from "@/lib/jobs/schema";
import { absoluteUrl, siteConfig } from "@/lib/site";

const ORG_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

export function organizationJsonLd() {
  const sameAs = Object.values(siteConfig.social).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: siteConfig.name,
    url: absoluteUrl("/"),
    logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png"), width: 512, height: 512 },
    email: siteConfig.contactEmail,
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    inLanguage: siteConfig.language,
    publisher: { "@id": ORG_ID },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function articleJsonLd(article: Article, author: Author | null) {
  const url = absoluteUrl(`/blog/${article.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: article.title,
    description: article.seoDescription ?? article.excerpt,
    image: [absoluteUrl(`/blog/${article.slug}/opengraph-image`)],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    articleSection: categories[article.category].name,
    keywords: article.tags.join(", "),
    wordCount: article.wordCount,
    inLanguage: siteConfig.language,
    author: author
      ? { "@type": author.type, name: author.name, url: absoluteUrl(`/authors/${author.slug}`) }
      : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}

export function collectionPageJsonLd(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": WEBSITE_ID },
  };
}

const employmentTypeSchema: Record<Job["employmentType"], string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  internship: "INTERN",
  freelance: "CONTRACTOR",
};

function htmlList(title: string, items: string[]): string {
  if (items.length === 0) return "";
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<h3>${title}</h3><ul>${items.map((i) => `<li>${escape(i)}</li>`).join("")}</ul>`;
}

/** Google for Jobs structured data. */
export function jobPostingJsonLd(job: Job) {
  const url = absoluteUrl(`/jobs/${job.slug}`);
  const remote = job.workModel === "remote";
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${url}#job`,
    url,
    title: job.title,
    description: [
      `<p>${job.summary.replace(/</g, "&lt;")}</p>`,
      htmlList("Responsibilities", job.responsibilities),
      htmlList("Requirements", job.requirements),
      htmlList("Benefits", job.benefits),
    ].join(""),
    datePosted: job.postedAt,
    ...(job.deadline && { validThrough: job.deadline }),
    employmentType: employmentTypeSchema[job.employmentType],
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(job.companyWebsite && { sameAs: job.companyWebsite }),
    },
    ...(remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: job.country },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              ...(job.city && { addressLocality: job.city }),
              addressCountry: job.country,
            },
          },
        }),
    directApply: false,
  };
}
