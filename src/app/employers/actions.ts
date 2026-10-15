"use server";

import { ApiRequestError, apiSend, hasApi } from "@/lib/api/client";
import { visitor } from "@/lib/candidate/session";
import { COMPANY_REQUEST_FIELDS, companyRequestSchema } from "@/lib/employers/schema";
import type { FormState } from "@/lib/forms/form-state";
import { isSuspiciousTiming } from "@/lib/forms/schemas";
import { siteConfig } from "@/lib/site";

const unavailable = (values: Record<string, string>): FormState => ({
  status: "error",
  message: `We couldn't send your request just now. Please try again in a minute, or email us at ${siteConfig.contactEmail}.`,
  values,
});

/**
 * "For employers": a company asks for an account. Checked here, then sent to the API, which checks
 * it again, saves it for a super admin to review and emails the company a receipt.
 */
export async function submitCompanyRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = Object.fromEntries(COMPANY_REQUEST_FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  // Bots fill the hidden "company" field: they're told it worked and nothing is sent.
  if (String(formData.get("company") ?? "")) return { status: "success", message: "Thanks! We've received your request." };

  const parsed = companyRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors, values };
  }
  if (isSuspiciousTiming(parsed.data.startedAt)) {
    return { status: "error", message: "That was quick! Please press the button again to send.", values };
  }
  if (!hasApi()) return unavailable(values);

  const body = { ...parsed.data, startedAt: undefined }; // the timing check stays on this side
  try {
    const res = await apiSend<{ message: string }>("/public/company-requests", { method: "POST", body, visitor: await visitor() });
    return { status: "success", message: res?.message ?? "Thanks! We've received your request." };
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status >= 500) {
      if (!(error instanceof ApiRequestError)) console.error("[employers] couldn't reach the API", error);
      return unavailable(values);
    }
    const fieldErrors = Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, [v]]));
    return { status: "error", message: error.message, fieldErrors, values };
  }
}
