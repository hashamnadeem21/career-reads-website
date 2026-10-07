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

/** Consistent metadata for every indexable page: unique title/description, canonical, OG, Twitter. */
export function buildMetadata({ title, description, path, image, noindex, absoluteTitle }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const images = image
    ? [{ url: image.url, alt: image.alt, width: image.width ?? 1200, height: image.height ?? 630 }]
    : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : title,
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
