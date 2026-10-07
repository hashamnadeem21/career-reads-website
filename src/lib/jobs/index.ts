import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { z } from "zod";
import { ensureSiteData } from "@/lib/site-data";
import { SLUG_PATTERN } from "@/lib/content/schema";
import { apiGet, apiPath, hasApi } from "@/lib/api/client";
import { isJobCategorySlug, type EmploymentType, type ExperienceLevel, type JobCategorySlug, type WorkModel } from "./categories";
import { jobSchema, type Job } from "./schema";

import { isJobVisible } from "./visibility";

export type { Job } from "./schema";
export { jobLocation } from "./schema";
export { isJobVisible } from "./visibility";

const JOBS_DIR = path.join(process.cwd(), "content", "jobs");

export function parseJobFile(fileName: string, source: string): Job {
  const slug = fileName.replace(/\.json$/, "");
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`Job file name "${fileName}" must be a lowercase kebab-case slug.`);
  }
  const parsed = jobSchema.safeParse(JSON.parse(source));
  if (!parsed.success) throw new Error(`Invalid job in ${fileName}:\n${z.prettifyError(parsed.error)}`);
  if (!isJobCategorySlug(parsed.data.category)) {
    throw new Error(`Invalid job in ${fileName}: unknown category "${parsed.data.category}".`);
  }
  return { ...parsed.data, slug };
}

/** Visible jobs from the API (it applies isJobVisible), cached until the API revalidates "jobs". */
const loadJobsFromApi = unstable_cache(
  async (): Promise<Job[]> => (await apiGet<Job[]>(apiPath("/public/jobs"))) ?? [],
  ["api-jobs"],
  { tags: ["jobs"], revalidate: 3600 },
);

async function loadJobs(): Promise<Job[]> {
  if (hasApi()) return loadJobsFromApi();
  return loadJobsFromFiles();
}

async function loadJobsFromFiles(): Promise<Job[]> {
  let files: string[];
  try {
    files = (await fs.readdir(JOBS_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const jobs = await Promise.all(
    files.map(async (file) => parseJobFile(file, await fs.readFile(path.join(JOBS_DIR, file), "utf8"))),
  );
  return jobs.sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.postedAt.localeCompare(a.postedAt),
  );
}

/** Visible jobs: featured first, then newest. */
export const getJobs = cache(async (): Promise<Job[]> => {
  const now = new Date();
  const [jobs] = await Promise.all([loadJobs(), ensureSiteData()]);
  return jobs.filter((job) => isJobVisible(job, now));
});

export const getJobBySlug = cache(async (slug: string): Promise<Job | null> => {
  return (await getJobs()).find((job) => job.slug === slug) ?? null;
});

export interface JobFilters {
  q?: string;
  category?: JobCategorySlug;
  type?: EmploymentType;
  model?: WorkModel;
  experience?: ExperienceLevel;
}

export function filterJobs(jobs: Job[], filters: JobFilters): Job[] {
  const terms = (filters.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  return jobs.filter((job) => {
    if (filters.category && job.category !== filters.category) return false;
    if (filters.type && job.employmentType !== filters.type) return false;
    if (filters.model && job.workModel !== filters.model) return false;
    if (filters.experience && job.experience !== filters.experience) return false;
    if (terms.length) {
      const haystack = [job.title, job.company, job.city, job.country, job.summary].join(" ").toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });
}

export async function getJobCategoryCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const job of await getJobs()) counts[job.category] = (counts[job.category] ?? 0) + 1;
  return counts;
}

export async function getRelatedJobs(job: Job, limit = 3): Promise<Job[]> {
  return (await getJobs()).filter((j) => j.slug !== job.slug && j.category === job.category).slice(0, limit);
}
