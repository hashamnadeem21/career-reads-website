import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/JsonLd";
import { learningFrom } from "@/components/home/KeyLearnings";
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { makeArticle } from "./fixtures";

describe("buildMetadata", () => {
  it("sets canonical, Open Graph and Twitter consistently", () => {
    const m = buildMetadata({ title: "About", description: "About this site, in a sentence or two.", path: "/about" });
    expect(m.alternates?.canonical).toBe(absoluteUrl("/about"));
    expect(m.openGraph).toMatchObject({ url: absoluteUrl("/about"), title: "About" });
    expect(m.robots).toBeUndefined();
  });
  it("supports noindex", () => {
    const m = buildMetadata({ title: "x", description: "y", path: "/x", noindex: true });
    expect(m.robots).toEqual({ index: false, follow: true });
  });
});

describe("JSON-LD", () => {
  it("builds BlogPosting with dates, section and author", () => {
    const data = articleJsonLd(makeArticle({ updatedAt: "2026-09-10T00:00:00.000Z" }), {
      slug: "editorial-team",
      name: "Team",
      type: "Organization",
      role: "Editors",
      bio: "x".repeat(50),
      avatar: "/a.svg",
      links: {},
    });
    expect(data).toMatchObject({
      "@type": "BlogPosting",
      dateModified: "2026-09-10T00:00:00.000Z",
      articleSection: "Technology",
      author: { "@type": "Organization", name: "Team" },
    });
  });

  it("numbers breadcrumb items from 1", () => {
    const data = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]);
    expect(data.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });

  it("escapes < so content cannot break out of the script tag", () => {
    const { container } = render(<JsonLd data={{ name: "</script><script>alert(1)</script>" }} />);
    expect(container.querySelector("script")!.innerHTML).not.toContain("</script>");
  });
});

describe("home page structured data", () => {
  it("builds FAQPage questions with accepted answers", () => {
    const data = faqPageJsonLd([{ question: "Is it free?", answer: "Yes, it is free to use." }]);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Is it free?",
      acceptedAnswer: { "@type": "Answer", text: "Yes, it is free to use." },
    });
  });
  it("builds an ItemList of absolute URLs in order", () => {
    const data = itemListJsonLd("Featured", ["/blog/a", "/jobs/b"]);
    expect(data.itemListElement.map((i) => [i.position, i.url])).toEqual([
      [1, absoluteUrl("/blog/a")],
      [2, absoluteUrl("/jobs/b")],
    ]);
  });
});

describe("learningFrom", () => {
  it("uses the first sentence of an excerpt", () => {
    expect(learningFrom("Passkeys replace passwords with a key pair on your devices. Here is how they work.")).toBe(
      "Passkeys replace passwords with a key pair on your devices.",
    );
  });
  it("adds the second sentence when the first is a short hook, without splitting abbreviations", () => {
    expect(learningFrom("Forget the 5 a.m. extremes. A good routine is short and flexible. More here.")).toBe(
      "Forget the 5 a.m. extremes. A good routine is short and flexible.",
    );
  });
});
