import { expect, test } from "@playwright/test";

/*
 * Candidate accounts need the API, which this suite never calls (file-content mode). These check
 * what must hold anyway; the API and site were also tested together against the API's test database.
 */

test("account pages are never indexed", async ({ page }) => {
  for (const path of ["/account/sign-in", "/account/confirm-email?token=x", "/account/reset-password?token=x"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"][content*="noindex"]'), path).toHaveCount(1);
  }
  const robots = await (await page.request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /account/");
});

test("sign-in offers creating an account, signing in and a forgotten password", async ({ page }) => {
  await page.goto("/account/sign-in");
  await expect(page.getByTestId("signup-form")).toBeVisible();
  await expect(page.getByTestId("signup-form").getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
  await page.getByRole("tab", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByTestId("forgot-form")).toBeVisible();
});

test("a confirm link only works with a button press, and a broken one says so", async ({ page }) => {
  await page.goto("/account/confirm-email?token=abcdefghijklmnopqrstuvwxyz0123456789");
  await expect(page.getByRole("button", { name: "Confirm my email" })).toBeVisible();
  await page.goto("/account/confirm-email");
  await expect(page.getByRole("heading", { name: "This link doesn't work" })).toBeVisible();
});

test("without the API there is no account button, and /account asks to sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("sign-in-link")).toHaveCount(0);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/sign-in\?mode=signin&next=%2Faccount|\/account\/sign-in\?mode=signin&next=\/account/);
});
