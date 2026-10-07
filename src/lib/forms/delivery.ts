import "server-only";
import { isProduction, serverEnv } from "@/lib/env";
import type { ContactInput } from "./schemas";

/**
 * Integration boundaries for form submissions. Each function returns `true`
 * when the submission was handed off successfully.
 *
 * - Contact: Resend (https://resend.com) when RESEND_API_KEY + CONTACT_TO_EMAIL are set.
 * - Newsletter: POSTs JSON to NEWSLETTER_WEBHOOK_URL (works with most ESPs,
 *   Zapier, Make, or your own API).
 *
 * In development without configuration, submissions are logged instead.
 */

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function deliverContactMessage(input: ContactInput): Promise<boolean> {
  const env = serverEnv();

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    if (!isProduction) {
      console.info("[contact] Delivery not configured — message received in development:", {
        name: input.name,
        email: input.email,
        topic: input.topic,
      });
      return true;
    }
    console.error("[contact] RESEND_API_KEY / CONTACT_TO_EMAIL not configured.");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL ?? "Career Reads Contact <onboarding@resend.dev>",
      to: [env.CONTACT_TO_EMAIL],
      reply_to: input.email,
      subject: `[Career Reads contact] ${input.topic} — ${input.name}`,
      html: `<p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
<p><strong>Topic:</strong> ${escapeHtml(input.topic)}</p>
<p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch((error: unknown) => {
    console.error("[contact] Resend request failed", error);
    return null;
  });

  if (!response?.ok) {
    console.error("[contact] Resend responded with", response?.status);
    return false;
  }
  return true;
}

export async function deliverNewsletterSignup(email: string): Promise<boolean> {
  const env = serverEnv();

  if (!env.NEWSLETTER_WEBHOOK_URL) {
    if (!isProduction) {
      console.info("[newsletter] Webhook not configured — signup received in development.");
      return true;
    }
    console.error("[newsletter] NEWSLETTER_WEBHOOK_URL not configured.");
    return false;
  }

  const response = await fetch(env.NEWSLETTER_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.NEWSLETTER_WEBHOOK_SECRET && { Authorization: `Bearer ${env.NEWSLETTER_WEBHOOK_SECRET}` }),
    },
    body: JSON.stringify({ email, source: "careerreads-website", subscribedAt: new Date().toISOString() }),
    signal: AbortSignal.timeout(10_000),
  }).catch((error: unknown) => {
    console.error("[newsletter] Webhook request failed", error);
    return null;
  });

  return Boolean(response?.ok);
}
