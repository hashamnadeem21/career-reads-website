import { expect, test } from "@playwright/test";

test("homepage renders key sections with a single h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  for (const name of ["Browse jobs by category", "Latest jobs", "Latest articles", "Read by topic", "One thoughtful email a week"]) {
    await expect(page.getByRole("heading", { name, exact: false }).first()).toBeVisible();
  }
});

test("main navigation and category filters work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Blog" }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole("heading", { level: 1, name: "All articles" })).toBeVisible();

  await page.getByRole("navigation", { name: "Filter by category" }).getByRole("link", { name: /Travel/ }).click();
  await expect(page).toHaveURL(/\/category\/travel$/);
  await expect(page.getByRole("link", { name: /Travel/ }).first()).toHaveAttribute("aria-current", "page");
});

test("blog pagination uses clean URLs and redirects page 1", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("link", { name: "Page 2" }).click();
  await expect(page).toHaveURL(/\/blog\/page\/2$/);
  await expect(page.getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page");

  await page.goto("/blog/page/1");
  await expect(page).toHaveURL(/\/blog$/);
});

test("unknown routes return a 404 page", async ({ page }) => {
  const res = await page.goto("/this-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page flew the nest" })).toBeVisible();
  expect((await page.goto("/blog/page/999"))?.status()).toBe(404);
  expect((await page.goto("/category/not-a-category"))?.status()).toBe(404);
});

test("draft articles are never publicly accessible", async ({ page, request }) => {
  expect((await page.goto("/blog/running-ai-models-locally"))?.status()).toBe(404);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const rss = await (await request.get("/rss.xml")).text();
  expect(sitemap).not.toContain("running-ai-models-locally");
  expect(rss).not.toContain("running-ai-models-locally");
});

test("keyboard users can skip to content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});
