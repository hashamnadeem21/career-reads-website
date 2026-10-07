import { expect, test } from "@playwright/test";

// Phone-sized viewport: checks overflow and the mobile menu where they matter.
test.use({ viewport: { width: 390, height: 844 } });

for (const path of ["/", "/jobs", "/blog", "/blog/fix-slow-home-wifi", "/contact", "/search?q=travel", "/privacy-policy"]) {
  test(`no horizontal overflow on ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("mobile menu opens, moves focus into the menu, and closes with Escape", async ({ page }) => {
  await page.goto("/");
  const button = page.getByTestId("mobile-menu-button");
  await button.click();
  const dialog = page.getByRole("dialog", { name: "Site menu" });
  await expect(dialog).toBeVisible();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(dialog.getByRole("link").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();

  await button.click();
  await page.getByRole("dialog").getByRole("link", { name: "Trending" }).click();
  await expect(page).toHaveURL(/\/trending$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});
