import { describe, expect, it } from "vitest";
import { jobSchema } from "@/lib/jobs/schema";
import { jobPostingJsonLd } from "@/lib/jsonld";
import { checkAnswer } from "@/lib/jobs/questions";

const base = {
  title: "Support Engineer",
  company: "Acme",
  country: "Pakistan",
  workModel: "remote",
  employmentType: "full-time",
  category: "software-it",
  experience: "mid",
  summary: "Help customers succeed with our product and fix what slows them down.",
  postedAt: "2026-10-01T00:00:00.000Z",
  status: "published",
};

describe("applying on Career Reads", () => {
  it("accepts a job whose only way to apply is on Career Reads", () => {
    expect(jobSchema.safeParse({ ...base, onsiteApply: true }).success).toBe(true);
    expect(jobSchema.safeParse(base).success).toBe(false);
    expect(jobSchema.parse({ ...base, applyEmail: "jobs@acme.test" }).onsiteApply).toBe(false);
  });

  it("tells Google for Jobs when people can apply on the site itself", () => {
    const onsite = { ...jobSchema.parse({ ...base, onsiteApply: true }), slug: "support-engineer-acme" };
    const external = { ...jobSchema.parse({ ...base, applyUrl: "https://acme.test/jobs" }), slug: "support-engineer-acme" };
    expect(jobPostingJsonLd(onsite)).toMatchObject({ directApply: true });
    expect(jobPostingJsonLd(external)).toMatchObject({ directApply: false });
  });

  it("checks answers with the API's rules", () => {
    const question = { id: "q", kind: "yes_no" as const, label: "Relocate?", options: [], required: true };
    expect(checkAnswer(question, "yes")).toEqual({ value: true });
    expect(checkAnswer(question, undefined)).toEqual({ error: "Please answer this question" });
  });
});
