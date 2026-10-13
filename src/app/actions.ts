"use server";

import { headers } from "next/headers";
import { deliverContactMessage, deliverNewsletterSignup } from "@/lib/forms/delivery";
import type { FormState } from "@/lib/forms/form-state";
import { rateLimit } from "@/lib/forms/rate-limit";
import { storeContactMessage, storeSubscriber } from "@/lib/forms/store";
import { contactSchema, isSuspiciousTiming, newsletterSchema } from "@/lib/forms/schemas";

const RATE_WINDOW_MS = 10 * 60 * 1000;

async function visitorIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

async function clientKey(scope: string): Promise<string> {
  return `${scope}:${(await visitorIp()) ?? "unknown"}`;
}

function formValues(formData: FormData, fields: string[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f, String(formData.get(f) ?? "")]));
}

/** Bots that fill the honeypot get the same success message as humans so they learn nothing. */
const silentSuccess = (message: string): FormState => ({ status: "success", message });

/** Sent too fast (or before the page was ready): ask a human to try again instead of dropping it. */
const tooFast = (values: Record<string, string>): FormState => ({
  status: "error",
  message: "That was quick! Please press the button again to send.",
  values,
});

/**
 * Saving to the admin inbox is what counts. Only when no API is configured (`stored` is null)
 * does a successful email or webhook delivery count instead.
 */
const handedOff = (stored: boolean | null, delivered: boolean) => (stored === null ? delivered : stored);

export async function subscribeToNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["email"]);
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  const successMessage = "Thanks! Please check your inbox to confirm your subscription.";

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    if (fieldErrors.company) return silentSuccess(successMessage);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors, values };
  }
  if (isSuspiciousTiming(parsed.data.startedAt)) return tooFast(values);
  if (!rateLimit(await clientKey("newsletter"), 5, RATE_WINDOW_MS).allowed) {
    return { status: "error", message: "Too many attempts. Please try again in a few minutes.", values };
  }

  // Saved for the admin inbox (when the API is configured) and sent to the newsletter webhook.
  const [stored, delivered] = await Promise.all([storeSubscriber(parsed.data.email, await visitorIp()), deliverNewsletterSignup(parsed.data.email)]);
  return handedOff(stored, delivered)
    ? silentSuccess(successMessage)
    : { status: "error", message: "Something went wrong. Please try again later.", values };
}

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["name", "email", "topic", "message"]);
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  const successMessage = "Thanks for getting in touch. We usually reply within two working days.";

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    if (fieldErrors.company) return silentSuccess(successMessage);
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors, values };
  }
  if (isSuspiciousTiming(parsed.data.startedAt)) return tooFast(values);
  if (!rateLimit(await clientKey("contact"), 3, RATE_WINDOW_MS).allowed) {
    return { status: "error", message: "Too many messages. Please try again in a few minutes.", values };
  }

  // Saved to the admin inbox (when the API is configured) and emailed when delivery is set up.
  const [stored, delivered] = await Promise.all([storeContactMessage(parsed.data, await visitorIp()), deliverContactMessage(parsed.data)]);
  return handedOff(stored, delivered)
    ? silentSuccess(successMessage)
    : { status: "error", message: "We couldn't send your message. Please email us directly.", values };
}
