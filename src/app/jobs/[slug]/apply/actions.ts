"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { ApiRequestError, apiPath, apiSend, hasApi } from "@/lib/api/client";
import { type ApplyResult, MAX_CV_BYTES } from "@/lib/apply/limits";
import { clearSession, sessionToken } from "@/lib/candidate/session";
import { isSuspiciousTiming } from "@/lib/forms/schemas";

// No email: the API uses the signed-in account's.
const FIELDS = ["name", "phone", "location", "linkedinUrl", "coverLetter", "answers", "consent"] as const;
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);

/**
 * Sends an application to the API, which checks everything again (fields, answers, the CV's real
 * file type) and stores the CV privately. It needs a signed-in candidate (the session cookie goes
 * along as X-Candidate-Session); the visitor's address goes along for its rate limit.
 */
export async function submitApplication(slug: string, formData: FormData): Promise<ApplyResult> {
  if (!hasApi()) return { status: "error", message: "Applications aren't available right now. Please try again later." };
  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) return { status: "error", message: "This job isn't taking applications." };
  const session = await sessionToken();
  if (!session) return { status: "signed_out", message: "Please sign in to apply." };

  // Bots fill the hidden field: they're told it worked and nothing is sent.
  if (String(formData.get("company") ?? "")) return { status: "success", message: "Application sent." };
  const startedAt = Number(formData.get("startedAt"));
  if (isSuspiciousTiming(Number.isFinite(startedAt) ? startedAt : undefined)) {
    return { status: "error", message: "That was quick! Please press the button again to send your application." };
  }

  // A new file, or "use my saved CV" (the API sends the one on their account).
  const file = formData.get("cv");
  const cv = file instanceof File && file.size > 0 ? file : null;
  const useSavedCv = !cv && formData.get("useSavedCv") === "true";
  if (!cv && !useSavedCv) return { status: "error", message: "Attach your CV.", fieldErrors: { cv: "Attach your CV" } };
  if (cv && cv.size > MAX_CV_BYTES) {
    return { status: "error", message: "Your CV is too large.", fieldErrors: { cv: "Your CV must be 4 MB or smaller" } };
  }

  const body = new FormData();
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string" && value !== "") body.set(field, value);
  }
  if (cv) body.set("cv", cv, cv.name);
  else body.set("useSavedCv", "true");

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  try {
    const res = await apiSend<{ status: "submitted" | "held" | "already_applied"; message: string }>(
      apiPath("/public/jobs/{slug}/applications", { slug: parsedSlug.data }),
      { method: "POST", body, visitor: { ip }, candidateSession: session },
    );
    if (res?.status === "held") return { status: "held", message: res.message };
    if (res?.status === "already_applied") return { status: "already_applied", message: res.message };
    return { status: "success", message: "Application sent." };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      await clearSession();
      return { status: "signed_out", message: "Your session ended. Please sign in again to send your application." };
    }
    if (!(error instanceof ApiRequestError)) {
      console.error("[apply] couldn't reach the API", error);
      return { status: "error", message: "We couldn't send your application. Please try again in a minute." };
    }
    if (error.status >= 500) return { status: "error", message: "We couldn't send your application. Please try again in a minute." };
    return { status: "error", message: error.message, fieldErrors: error.fields };
  }
}
