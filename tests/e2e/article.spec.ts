import { expect, test } from "@playwright/test";

const SLUG = "how-passkeys-work";

test("article page has metadata, structured data, TOC and related content", async ({ page }) => {
  await page.goto(`/blog/${SLUG}`);

  await expect(page).toHaveTitle("Passkeys Explained: How Passwordless Sign-In Works | Career Reads");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/blog/${SLUG}$`));
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /opengraph-image/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /passkeys/i);

  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = jsonLd.flatMap((t) => [JSON.parse(t)].flat().map((d: { "@type": string }) => d["@type"]));
  expect(types).toEqual(expect.arrayContaining(["BlogPosting", "BreadcrumbList", "Organization", "WebSite"]));

  await expect(page.locator("h1")).toHaveCount(1);
  const toc = page.getByRole("navigation", { name: "Table of contents" }).or(page.locator('nav[aria-labelledby="toc-heading"]'));
  const firstEntry = toc.first().getByRole("link").first();
  const target = await firstEntry.getAttribute("href");
  await firstEntry.click();
  await expect(page.locator(target!)).toBeInViewport();

  await expect(page.getByRole("heading", { name: "Related articles" })).toBeVisible();
  await expect(page.getByTestId("share-buttons").getByRole("link", { name: "Share on LinkedIn" })).toHaveAttribute(
    "href",
    /linkedin\.com/,
  );
});

test("cover images reserve space and below-the-fold images lazy load", async ({ page }) => {
  await page.goto(`/blog/${SLUG}`);
  const cover = page.locator("header img").last();
  await expect(cover).toHaveAttribute("alt", /.+/);
  expect(await cover.getAttribute("loading")).not.toBe("lazy");
  const lazy = await page.locator('img[loading="lazy"]').count();
  expect(lazy).toBeGreaterThan(0);
});

test("ads are not rendered without configuration", async ({ page }) => {
  await page.goto(`/blog/${SLUG}`);
  await expect(page.locator("ins.adsbygoogle")).toHaveCount(0);
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
});

test("article shows its hero image and in-article images in place", async ({ page }) => {
  await page.goto("/blog/how-passkeys-work");
  await expect(page.locator("article header img")).toHaveCount(2); // author avatar + hero image
  const figures = page.locator("article .prose figure img");
  await expect(figures).toHaveCount(2);
  // "middle" image sits right under the middle section heading.
  const nextToHeading = page.locator("h2#synced-passkeys-vs-device-bound-passkeys + figure img");
  await expect(nextToHeading).toHaveAttribute("src", /how-passkeys-work-1\.svg/);
});

test("homepage hero renders the animated 3D scene", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("section canvas").first();
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((c: HTMLCanvasElement) => c.width > 0 && c.height > 0)).toBe(true);
});
