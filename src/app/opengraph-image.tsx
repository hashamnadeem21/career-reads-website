import { ogSize, renderOgImage } from "@/lib/og";
import { siteConfig } from "@/lib/site";

export const size = ogSize;
export const contentType = "image/png";
export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;

export default function Image() {
  return renderOgImage({
    title: "Find your next job. Learn something useful.",
    eyebrow: "Jobs · Guides",
    footer: new URL(siteConfig.url).host,
  });
}
