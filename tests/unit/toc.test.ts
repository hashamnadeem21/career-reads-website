import { describe, expect, it } from "vitest";
import { extractToc, injectInArticleAd, injectArticleImages, placeableSectionIds } from "@/lib/content/toc";

describe("extractToc", () => {
  it("collects h2/h3 with github-style ids and skips code fences", () => {
    const md = ["# Title", "## First *section*", "text", "```", "## not a heading", "```", "### Sub [link](/x)", "## First section"].join("\n");
    expect(extractToc(md)).toEqual([
      { id: "first-section", text: "First section", depth: 2 },
      { id: "sub-link", text: "Sub link", depth: 3 },
      { id: "first-section-1", text: "First section", depth: 2 },
    ]);
  });
});

describe("injectInArticleAd", () => {
  const md = ["intro", "## One", "a", "## Two", "b", "## Three", "c"].join("\n");

  it("inserts the marker before the third h2", () => {
    const out = injectInArticleAd(md);
    expect(out.indexOf("<InArticleAd />")).toBeLessThan(out.indexOf("## Three"));
    expect(out.indexOf("<InArticleAd />")).toBeGreaterThan(out.indexOf("## Two"));
  });

  it("respects a manually placed marker", () => {
    const manual = `${md}\n<InArticleAd />`;
    expect(injectInArticleAd(manual)).toBe(manual);
  });

  it("leaves short articles untouched", () => {
    expect(injectInArticleAd("## Only\ntext")).toBe("## Only\ntext");
  });
});

describe("injectArticleImages", () => {
  const doc = ["Intro paragraph.", "", "## First", "One.", "", "## Second", "Two.", "", "### Detail", "More.", "", "## Last", "End."].join("\n");
  const markerLine = (out: string, i: number) => out.split("\n").indexOf(`<ArticleImage index={${i}} />`);
  const lineOf = (out: string, text: string) => out.split("\n").indexOf(text);

  it("places images after the intro, in the middle, and before the conclusion", () => {
    const out = injectArticleImages(doc, [
      { placement: "after-intro" },
      { placement: "middle" },
      { placement: "before-conclusion" },
    ]);
    expect(markerLine(out, 0)).toBeLessThan(lineOf(out, "## First"));
    expect(markerLine(out, 1)).toBe(lineOf(out, "## Second") + 2);
    expect(markerLine(out, 2)).toBeLessThan(lineOf(out, "## Last"));
    expect(markerLine(out, 2)).toBeGreaterThan(lineOf(out, "More."));
  });

  it("places an image under a specific heading and falls back to middle for unknown ids", () => {
    const out = injectArticleImages(doc, [{ placement: "section:detail" }, { placement: "section:missing" }]);
    expect(markerLine(out, 0)).toBe(lineOf(out, "### Detail") + 2);
    expect(markerLine(out, 1)).toBe(lineOf(out, "## Second") + 2);
  });

  it("ignores headings inside code fences and appends when there are no sections", () => {
    const fenced = ["Text", "```", "## not a heading", "```"].join("\n");
    const out = injectArticleImages(fenced, [{ placement: "middle" }]);
    expect(out.trimEnd().endsWith("<ArticleImage index={0} />")).toBe(true);
    expect(placeableSectionIds(doc)).toEqual(["first", "second", "detail", "last"]);
  });
});
