import { categoryList } from "@/lib/categories";
import { getAllArticles } from "@/lib/content";
import { getJobs, jobLocation } from "@/lib/jobs";
import { ensureSiteData } from "@/lib/site-data";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const revalidate = 3600;

/**
 * /llms.txt (llmstxt.org): a plain Markdown map of the site for AI assistants and answer engines,
 * so they can find and cite the right pages. Lists only public, indexable pages.
 */
export async function GET() {
  await ensureSiteData();
  const [articles, jobs] = await Promise.all([getAllArticles(), getJobs()]);
  const guides = articles
    .filter((a) => a.status === "published" && !a.noindex && !a.canonicalUrl)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const listedJobs = jobs.filter((j) => !j.sample);

  const link = (title: string, path: string, note?: string) =>
    `- [${title}](${absoluteUrl(path)})${note ? `: ${note.replace(/\s+/g, " ").trim()}` : ""}`;

  const body = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "Job listings link to the employer's own application page or email, and come off the site once their last day to apply has passed. Guides are researched by the editorial team and show their publish and last-updated dates.",
    "",
    "## Main pages",
    "",
    link("Jobs", "/jobs", "All current job openings, with filters for category, job type, work model, and experience."),
    link("All guides", "/blog", "Every published guide, newest first."),
    link("Latest guides", "/latest"),
    link("About", "/about", "Who writes Career Reads and how the site is run."),
    link("Editorial policy", "/editorial-policy"),
    link("Contact", "/contact"),
    "",
    "## Topics",
    "",
    ...categoryList.map((c) => link(c.headline, `/category/${c.slug}`, c.description)),
    "",
    "## Guides",
    "",
    ...guides.map((a) => link(a.title, `/blog/${a.slug}`, a.excerpt)),
    ...(listedJobs.length
      ? ["", "## Open jobs", "", ...listedJobs.map((j) => link(`${j.title} at ${j.company}`, `/jobs/${j.slug}`, jobLocation(j)))]
      : []),
    "",
    "## Optional",
    "",
    link("RSS feed", "/rss.xml"),
    link("Sitemap", "/sitemap.xml"),
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
