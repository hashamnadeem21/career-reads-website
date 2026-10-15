import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { jobTitleTag } from "@/lib/jobs";
import { parseSalary } from "@/lib/jobs/salary";
import { jobSchema } from "@/lib/jobs/schema";
import { jobPostingJsonLd, organizationJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { OFFICIAL_SOCIAL, siteConfig } from "@/lib/site";

const job = (over: Record<string, unknown> = {}) => ({
  ...jobSchema.parse({
    title: "Associate Software Quality Assurance Engineer (Fresh Graduates)",
    company: "TechnoCares",
    city: "Model Town, Lahore",
    country: "Pakistan",
    workModel: "on-site",
    employmentType: "full-time",
    category: "software-it",
    experience: "entry",
    summary: "Test our products and help ship releases that work the first time for everyone.",
    postedAt: "2026-10-01T00:00:00.000Z",
    status: "published",
    onsiteApply: true,
    ...over,
  }),
  slug: "qa-engineer-technocares",
});

describe("salary for Google for Jobs", () => {
  it("reads clear ranges and single amounts", () => {
    expect(parseSalary("PKR 80,000 – 120,000 per month")).toEqual({ currency: "PKR", min: 80_000, max: 120_000, unit: "MONTH" });
    expect(parseSalary("Rs 150k/month")).toEqual({ currency: "PKR", min: 150_000, unit: "MONTH" });
    expect(parseSalary("$40,000 - $55,000 a year")).toEqual({ currency: "USD", min: 40_000, max: 55_000, unit: "YEAR" });
    expect(parseSalary("1.2 lakh PKR monthly")).toEqual({ currency: "PKR", min: 120_000, unit: "MONTH" });
  });

  it("leaves anything vague out", () => {
    for (const text of ["Based on experience, technical expertise, and level of responsibility", "Unpaid Trainee", "Negotiable", "80,000 - 120,000", "PKR 80,000", "PKR 120,000 - 80,000 per month", undefined]) {
      expect(parseSalary(text)).toBeNull();
    }
  });
});

describe("job pages in search results", () => {
  it("keeps the title within what Google shows", () => {
    expect(jobTitleTag(job({ title: "MERN Developer", company: "Big Entities", city: "Lahore" }))).toBe("MERN Developer at Big Entities, Lahore");
    expect(jobTitleTag(job({ title: "Graphic Designer", company: "Advanced Asset Management", workModel: "remote", city: undefined }))).toBe(
      "Graphic Designer at Advanced Asset Management, Remote",
    );
    expect(jobTitleTag(job())).toBe("Associate Software Quality Assurance Engineer (Fresh Graduates) at TechnoCares");
  });

  it("gives Google an ID, and the salary only when it's clear", () => {
    const withSalary = jobPostingJsonLd(job({ salary: "PKR 80,000 - 120,000 per month" }));
    expect(withSalary.identifier).toEqual({ "@type": "PropertyValue", name: "Career Reads", value: "qa-engineer-technocares" });
    expect(withSalary.baseSalary).toEqual({
      "@type": "MonetaryAmount",
      currency: "PKR",
      value: { "@type": "QuantitativeValue", minValue: 80_000, maxValue: 120_000, unitText: "MONTH" },
    });
    expect(jobPostingJsonLd(job({ salary: "Based on experience" }))).not.toHaveProperty("baseSalary");
  });
});

describe("sharing and social profiles", () => {
  it("gives every page a share image", () => {
    const meta = buildMetadata({ title: "About", description: "About Career Reads", path: "/about" });
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: expect.stringMatching(/\/opengraph-image$/), width: 1200, height: 630 })]);
  });

  it("links the official LinkedIn and Instagram, in the footer and for search engines", () => {
    expect(siteConfig.social).toMatchObject(OFFICIAL_SOCIAL);
    expect(organizationJsonLd().sameAs).toEqual([OFFICIAL_SOCIAL.linkedin, OFFICIAL_SOCIAL.instagram]);
    render(<SocialLinks />);
    expect(screen.getByRole("link", { name: "Career Reads on LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/company/career-reads");
    expect(screen.getByRole("link", { name: "Career Reads on Instagram" })).toHaveAttribute("href", "https://www.instagram.com/careersreads/");
    expect(screen.getByRole("link", { name: "Career Reads on Instagram" })).toHaveAttribute("target", "_blank");
  });
});
