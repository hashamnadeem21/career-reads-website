import { expect, test } from "@playwright/test";

test("homepage hero renders the 3D scene", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("section canvas").first();
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((c: HTMLCanvasElement) => c.width > 0 && c.height > 0)).toBe(true);
});

test("homepage FAQ opens and matches its FAQPage markup", async ({ page }) => {
  await page.goto("/");
  const faq = page.locator('section[aria-labelledby="faq"]');
  const question = faq.getByText("Should I ever pay to apply for a job?");
  await question.click();
  await expect(faq.getByText("Legitimate employers don't charge you to apply")).toBeVisible();

  const schemas = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.flatMap((n) => [JSON.parse(n.textContent ?? "null")].flat()));
  const faqPage = schemas.find((s) => s?.["@type"] === "FAQPage");
  const visible = await faq.locator("h3, h4").allTextContents();
  for (const { name } of faqPage.mainEntity) expect(visible).toContain(name);
});
