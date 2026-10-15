"use server";

import { ApiRequestError, apiSend, hasApi } from "@/lib/api/client";
import { MAX_CV_BYTES } from "@/lib/apply/limits";
import { clearSession, type IssuedSession, sessionToken, storeSession, visitor } from "@/lib/candidate/session";
import type { AuthResult, Candidate, SavedCv } from "@/lib/candidate/types";

/**
 * Candidate accounts: each action calls the API with the site's key (and the visitor's address for
 * its rate limits), keeps the session in the httpOnly cookie, and returns only what the form shows.
 */

interface SignedIn {
  session: IssuedSession;
  candidate: Candidate;
  created: boolean;
}

const UNAVAILABLE: AuthResult = { status: "error", message: "Accounts aren't available right now. Please try again later." };
const UNREACHABLE: AuthResult = { status: "error", message: "We couldn't reach Career Reads. Please try again in a minute." };
const SIGNED_OUT: AuthResult = { status: "error", message: "Please sign in again." };

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "");

function failed(error: unknown, what: string): AuthResult {
  if (!(error instanceof ApiRequestError)) {
    console.error(`[account] ${what}: couldn't reach the API`, error);
    return UNREACHABLE;
  }
  if (error.status >= 500 && error.code !== "google_disabled") return UNREACHABLE;
  return { status: "error", message: error.message, fieldErrors: Object.keys(error.fields).length ? error.fields : undefined };
}

async function signIn(path: string, body: unknown, what: string): Promise<AuthResult> {
  if (!hasApi()) return UNAVAILABLE;
  try {
    const res = await apiSend<SignedIn>(path, { method: "POST", body, visitor: await visitor() });
    await storeSession(res!.session);
    return { status: "success", candidate: res!.candidate, created: res!.created };
  } catch (error) {
    return failed(error, what);
  }
}

/** Calls an endpoint that needs the signed-in candidate; a dead session clears the cookie. */
async function asCandidate<T>(
  path: string,
  method: "GET" | "POST" | "DELETE",
  what: string,
  body?: FormData,
): Promise<{ ok: true; data: T | null } | { ok: false; result: AuthResult }> {
  if (!hasApi()) return { ok: false, result: UNAVAILABLE };
  const token = await sessionToken();
  if (!token) return { ok: false, result: SIGNED_OUT };
  try {
    return { ok: true, data: await apiSend<T>(path, { method, body, candidateSession: token, visitor: await visitor() }) };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      await clearSession();
      return { ok: false, result: SIGNED_OUT };
    }
    return { ok: false, result: failed(error, what) };
  }
}

export async function signInWithGoogle(credential: string): Promise<AuthResult> {
  if (typeof credential !== "string" || credential.length < 20 || credential.length > 5000) {
    return { status: "error", message: "Google sign-in didn't work. Please try again." };
  }
  return signIn("/public/candidate/auth/google", { credential }, "Google sign-in");
}

export async function createAccount(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const password = text(formData, "password");
  if (password !== text(formData, "confirmPassword")) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { confirmPassword: "The passwords don't match" } };
  }
  return signIn(
    "/public/candidate/auth/signup",
    { name: text(formData, "name"), email: text(formData, "email"), password, acceptTerms: formData.get("acceptTerms") === "on" },
    "sign-up",
  );
}

export async function signInWithPassword(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  return signIn("/public/candidate/auth/login", { email: text(formData, "email"), password: text(formData, "password") }, "sign-in");
}

export async function requestPasswordReset(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  if (!hasApi()) return UNAVAILABLE;
  const email = text(formData, "email");
  try {
    await apiSend("/public/candidate/auth/forgot-password", { method: "POST", body: { email }, visitor: await visitor() });
  } catch (error) {
    return failed(error, "forgot password");
  }
  return { status: "success", message: `If there's an account for ${email.trim()}, we've emailed it a link to choose a new password. The link works for an hour.` };
}

export async function resetPassword(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const password = text(formData, "password");
  if (password !== text(formData, "confirmPassword")) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { confirmPassword: "The passwords don't match" } };
  }
  return signIn("/public/candidate/auth/reset-password", { token: text(formData, "token"), password }, "reset password");
}

/** Confirms the email from the link in the welcome email (a button press, so link scanners can't use it up). */
export async function confirmEmail(token: string): Promise<AuthResult> {
  if (!hasApi()) return UNAVAILABLE;
  try {
    await apiSend("/public/candidate/auth/confirm-email", { method: "POST", body: { token }, visitor: await visitor() });
    return { status: "success", message: "Your email is confirmed." };
  } catch (error) {
    return failed(error, "confirm email");
  }
}

export async function resendConfirmation(): Promise<AuthResult> {
  const res = await asCandidate<{ message: string }>("/public/candidate/auth/resend-confirmation", "POST", "resend confirmation");
  return res.ok ? { status: "success", message: res.data?.message } : res.result;
}

/** Joins the newsletter list. No extra email: they already had the welcome email. */
export async function subscribeToJobAlerts(): Promise<AuthResult> {
  const res = await asCandidate("/public/candidate/subscribe", "POST", "subscribe");
  return res.ok ? { status: "success", message: "You're subscribed. Look out for our next newsletter." } : res.result;
}

export async function signOut(): Promise<AuthResult> {
  const token = await sessionToken();
  if (token && hasApi()) {
    try {
      await apiSend("/public/candidate/auth/logout", { method: "POST", candidateSession: token });
    } catch {
      // The cookie goes either way; an unused session expires on its own.
    }
  }
  await clearSession();
  return { status: "success" };
}

/** Saves a new CV on their account, in place of the old one. Applications already sent keep theirs. */
export async function uploadCv(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const cv = formData.get("cv");
  if (!(cv instanceof File) || cv.size === 0) return { status: "error", message: "Choose your CV.", fieldErrors: { cv: "Choose your CV" } };
  if (!/\.(pdf|docx)$/i.test(cv.name)) {
    return { status: "error", message: "Upload your CV as a PDF or Word (.docx) document.", fieldErrors: { cv: "Upload your CV as a PDF or Word (.docx) document" } };
  }
  if (cv.size > MAX_CV_BYTES) return { status: "error", message: "Your CV must be 4 MB or smaller.", fieldErrors: { cv: "Your CV must be 4 MB or smaller" } };
  const body = new FormData();
  body.set("cv", cv, cv.name);
  const res = await asCandidate<{ cv: SavedCv }>("/public/candidate/cv", "POST", "upload CV", body);
  return res.ok ? { status: "success", message: "Your CV is saved. We'll use it next time you apply." } : res.result;
}

export async function removeCv(): Promise<AuthResult> {
  const res = await asCandidate("/public/candidate/cv", "DELETE", "remove CV");
  return res.ok ? { status: "success", message: "Your CV is removed from your account." } : res.result;
}

export async function deleteAccount(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  if (text(formData, "confirm").trim().toUpperCase() !== "DELETE") {
    return { status: "error", message: "Type DELETE to confirm.", fieldErrors: { confirm: "Type DELETE to confirm" } };
  }
  const res = await asCandidate("/public/candidate/me", "DELETE", "delete account");
  if (!res.ok) return res.result;
  await clearSession();
  return { status: "success", message: "Your account, applications and CVs have been deleted." };
}
