import { expect, test } from "@playwright/test";

test("theme toggle switches and persists across reloads", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);

  await page.getByTestId("theme-toggle").click();
  await expect(html).toHaveClass(/dark/);
  await page.reload();
  await expect(html).toHaveClass(/dark/);

  await page.getByTestId("theme-toggle").click();
  await expect(html).not.toHaveClass(/dark/);
});

test("no hydration or console errors on key pages", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of ["/", "/blog", "/blog/writing-better-ai-prompts", "/contact", "/search?q=ai"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});

test("newsletter form validates input and keeps the typed value", async ({ page }) => {
  await page.goto("/");
  const form = page.getByTestId("newsletter-form");
  await form.getByRole("textbox", { name: "Email address" }).fill("not-an-email");
  await form.getByRole("button", { name: "Subscribe" }).click();
  await expect(form.getByText("Please enter a valid email address.")).toBeVisible();
  await expect(form.getByText("Please confirm you'd like to receive the newsletter.")).toBeVisible();
  await expect(form.getByRole("textbox", { name: "Email address" })).toHaveValue("not-an-email");
});

test("contact form validates fields server-side", async ({ page }) => {
  await page.goto("/contact");
  const form = page.getByTestId("contact-form");
  await form.getByLabel("Name").fill("A");
  await form.getByLabel("Email").fill("reader@example.com");
  await form.getByLabel("Message").fill("   ");
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(form.getByText("Please enter your name.")).toBeVisible();
  await expect(form.getByText("Please write your message.")).toBeVisible();
  await expect(form.getByLabel("Email")).toHaveValue("reader@example.com");
  await expect(form.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
});

test("contact form reports a delivery problem honestly when email is not configured", async ({ page }) => {
  await page.goto("/contact");
  const form = page.getByTestId("contact-form");
  await form.getByLabel("Name").fill("Sam Reader");
  await form.getByLabel("Email").fill("sam@example.com");
  await form.getByLabel("Message").fill("Hello! I have a question about one of your guides.");
  await page.waitForTimeout(2700); // humans take time; instant submissions are treated as bots
  await form.getByRole("button", { name: "Send message" }).click();
  // Production build without RESEND_API_KEY → visible fallback with the contact address.
  await expect(form.getByRole("alert")).toContainText("email us directly");
});
