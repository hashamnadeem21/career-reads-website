"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { ApiRequestError, apiPath, apiPost, hasApi } from "@/lib/api/client";
import { type ApplyResult, MAX_CV_BYTES } from "@/lib/apply/limits";
import { isSuspiciousTiming } from "@/lib/forms/schemas";

const FIELDS = ["name", "email", "phone", "location", "linkedinUrl", "coverLetter", "answers", "consent"] as const;
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);

/**
 * Sends an application to the API, which checks everything again (fields, answers, the CV's real
 * file type) and stores the CV privately. The visitor's address goes along for its rate limit.
 */
export async function submitApplication(slug: string, formData: FormData): Promise<ApplyResult> {
  if (!hasApi()) return { status: "error", message: "Applications aren't available right now. Please try again later." };
  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) return { status: "error", message: "This job isn't taking applications." };

  // Bots fill the hidden field: they're told it worked and nothing is sent.
  if (String(formData.get("company") ?? "")) return { status: "success", message: "Application sent." };
  const startedAt = Number(formData.get("startedAt"));
  if (isSuspiciousTiming(Number.isFinite(startedAt) ? startedAt : undefined)) {
    return { status: "error", message: "That was quick! Please press the button again to send your application." };
  }

  const cv = formData.get("cv");
  if (!(cv instanceof File) || cv.size === 0) return { status: "error", message: "Attach your CV.", fieldErrors: { cv: "Attach your CV" } };
  if (cv.size > MAX_CV_BYTES) {
    return { status: "error", message: "Your CV is too large.", fieldErrors: { cv: "Your CV must be 4 MB or smaller" } };
  }

  const body = new FormData();
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string" && value !== "") body.set(field, value);
  }
  body.set("cv", cv, cv.name);

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  try {
    await apiPost(apiPath("/public/jobs/{slug}/applications", { slug: parsedSlug.data }), body, { ip });
    return { status: "success", message: "Application sent." };
  } catch (error) {
    if (!(error instanceof ApiRequestError)) {
      console.error("[apply] couldn't reach the API", error);
      return { status: "error", message: "We couldn't send your application. Please try again in a minute." };
    }
    if (error.status >= 500) return { status: "error", message: "We couldn't send your application. Please try again in a minute." };
    return { status: "error", message: error.message, fieldErrors: error.fields };
  }
}
