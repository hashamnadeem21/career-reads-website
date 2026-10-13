import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "@/lib/forms/rate-limit";
import { contactSchema, isSuspiciousTiming, newsletterSchema } from "@/lib/forms/schemas";

describe("newsletterSchema", () => {
  it("accepts a valid signup and normalizes email", () => {
    const r = newsletterSchema.parse({ email: "  Reader@Example.COM ", consent: "on", startedAt: "123" });
    expect(r.email).toBe("reader@example.com");
    expect(r.startedAt).toBe(123);
  });
  it("rejects invalid email, missing consent, and filled honeypot", () => {
    expect(newsletterSchema.safeParse({ email: "nope", consent: "on" }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "a@b.co" }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "a@b.co", consent: "on", company: "Spam Inc" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  const valid = { name: "Sam", email: "sam@example.com", topic: "general", message: "Hello there, this is a real message." };
  it("accepts valid messages", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });
  it("accepts short messages; rejects empty ones, unknown topics and link spam", () => {
    expect(contactSchema.safeParse({ ...valid, message: "Hi" }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, message: "   " }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, topic: "crypto" }).success).toBe(false);
    const spam = `${valid.message} ${"https://spam.example ".repeat(4)}`;
    expect(contactSchema.safeParse({ ...valid, message: spam }).success).toBe(false);
  });
});

describe("spam timing", () => {
  it("flags missing and too-fast submissions, never slow ones", () => {
    const now = 1_000_000_000;
    expect(isSuspiciousTiming(undefined, now)).toBe(true);
    expect(isSuspiciousTiming(now - 500, now)).toBe(true);
    expect(isSuspiciousTiming(now - 2 * 86_400_000, now)).toBe(false);
    expect(isSuspiciousTiming(now - 10_000, now)).toBe(false);
  });
});

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());
  it("blocks after the limit and resets after the window", () => {
    const t = 0;
    expect(rateLimit("k", 2, 1000, t).allowed).toBe(true);
    expect(rateLimit("k", 2, 1000, t).allowed).toBe(true);
    expect(rateLimit("k", 2, 1000, t).allowed).toBe(false);
    expect(rateLimit("other", 2, 1000, t).allowed).toBe(true);
    expect(rateLimit("k", 2, 1000, t + 1001).allowed).toBe(true);
  });
});
