import { getJobBySlug, jobLocation } from "@/lib/jobs";
import { ogSize, renderOgImage } from "@/lib/og";
import { siteConfig } from "@/lib/site";

export const size = ogSize;
export const contentType = "image/png";
export const alt = `${siteConfig.name} job`;

/** The card shown when a job is shared (WhatsApp, LinkedIn, Facebook, X): role, employer, place. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  return renderOgImage({
    title: job?.title ?? "Jobs on Career Reads",
    eyebrow: job ? `${job.company} · ${jobLocation(job)}` : "Jobs",
    footer: job?.onsiteApply ? `Apply on ${siteConfig.name} · ${new URL(siteConfig.url).host}` : new URL(siteConfig.url).host,
  });
}
