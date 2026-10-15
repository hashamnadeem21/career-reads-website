import { publicEnv } from "@/lib/env";
import { runtimeSettings } from "@/lib/settings";

/** Career Reads' own profiles. A LinkedIn URL saved in admin Settings takes priority. */
export const OFFICIAL_SOCIAL = {
  linkedin: "https://www.linkedin.com/company/career-reads",
  instagram: "https://www.instagram.com/careersreads/",
} as const;

export interface SocialProfiles {
  linkedin: string;
  instagram: string;
  x: string;
  github: string;
}

export const siteConfig = {
  name: "Career Reads",
  shortName: "Career Reads",
  tagline: "Latest jobs and practical guides.",
  description:
    "Career Reads lists the latest jobs in tech, business, design, and more, and publishes simple, practical guides on technology, AI, productivity, travel, and lifestyle.",
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  locale: "en_US",
  language: "en",
  /** From admin Settings when set, otherwise NEXT_PUBLIC_CONTACT_EMAIL. */
  get contactEmail(): string {
    return runtimeSettings().site?.contactEmail || publicEnv.NEXT_PUBLIC_CONTACT_EMAIL;
  },
  /** Number of articles per listing page (blog, categories). */
  pageSize: 6,
  /** ISR window for content pages, in seconds. */
  revalidateSeconds: 3600,
  /** Admin Settings where set, otherwise the official profiles. Empty values are not rendered. */
  get social(): SocialProfiles {
    const stored = runtimeSettings().site?.social;
    return {
      linkedin: stored?.linkedin || OFFICIAL_SOCIAL.linkedin,
      instagram: OFFICIAL_SOCIAL.instagram,
      x: stored?.x ?? "",
      github: stored?.github ?? "",
    };
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/jobs", label: "Jobs" },
    { href: "/blog", label: "Blog" },
    { href: "/trending", label: "Trending" },
    { href: "/employers", label: "For employers" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  footer: {
    jobs: [
      { href: "/jobs", label: "All jobs" },
      { href: "/jobs?type=internship", label: "Internships" },
      { href: "/jobs?model=remote", label: "Remote jobs" },
      { href: "/jobs?category=software-it", label: "Software & IT jobs" },
    ],
    company: [
      { href: "/about", label: "About" },
      { href: "/employers", label: "For employers" },
      { href: "/contact", label: "Contact" },
      { href: "/editorial-policy", label: "Editorial policy" },
      { href: "/corrections-policy", label: "Corrections policy" },
    ],
    legal: [
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
      { href: "/advertising-disclosure", label: "Advertising disclosure" },
    ],
  },
} as const;

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${normalized}`;
}
