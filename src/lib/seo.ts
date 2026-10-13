import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

interface PageMetadataInput {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/about". Used for canonical + og:url. */
  path: string;
  /** Override the absolute og:image URL. Defaults to the site-wide OG image. */
  image?: { url: string; alt: string; width?: number; height?: number };
  noindex?: boolean;
  /** Skip the " | Career Reads" title template (used on the homepage). */
  absoluteTitle?: boolean;
}

/** Google shows roughly 60 characters of a title. */
const TITLE_LIMIT = 60;
/** …and roughly 155 characters of a description. */
const DESCRIPTION_LIMIT = 155;
const TITLE_SUFFIX = ` | ${siteConfig.name}`;

/**
 * The page title, with the " | Career Reads" suffix only when it still fits in a search result
 * and the title doesn't already name the site.
 * Long titles go out as-is so the words that matter aren't cut off.
 */
export function pageTitle(title: string): Metadata["title"] {
  const fits = title.length + TITLE_SUFFIX.length <= TITLE_LIMIT;
  return fits && !title.includes(siteConfig.name) ? title : { absolute: title };
}

/** Plain text trimmed to what search results show, cut at a word boundary. */
export function metaDescription(text: string, limit = DESCRIPTION_LIMIT): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (plain.length <= limit) return plain;
  const cut = plain.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
}

/** Consistent metadata for every indexable page: unique title/description, canonical, OG, Twitter. */
export function buildMetadata({ title, description: rawDescription, path, image, noindex, absoluteTitle }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const description = metaDescription(rawDescription);
  const images = image
    ? [{ url: image.url, alt: image.alt, width: image.width ?? 1200, height: image.height ?? 630 }]
    : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : pageTitle(title),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      ...(images && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images && { images: images.map((i) => i.url) }),
    },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}
