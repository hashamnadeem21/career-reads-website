import "server-only";
import { cookies, headers } from "next/headers";
import { ApiRequestError, apiSend, hasApi } from "@/lib/api/client";
import { isProduction } from "@/lib/env";
import type { Candidate, MyApplications } from "./types";

/**
 * Candidate sign-in. The API issues an opaque session token; the site keeps it in an httpOnly
 * cookie (scripts can't read it) and forwards it to the API as X-Candidate-Session. Staff sign in
 * to the admin separately: these sessions never open it.
 */
export const SESSION_COOKIE = "cr_session";

export interface IssuedSession {
  token: string;
  expiresAt: string;
}

export async function sessionToken(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value && /^[A-Za-z0-9_-]{20,200}$/.test(value) ? value : null;
}

/** Only call from a Server Function or Route Handler (cookies can't be set while rendering). */
export async function storeSession(session: IssuedSession): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function visitor() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent"),
  };
}

/**
 * The signed-in candidate, or null (no cookie, expired session, or no API). A stale cookie is left
 * for the next Server Function to clear, since rendering can't change cookies.
 */
export async function currentCandidate(): Promise<Candidate | null> {
  if (!hasApi()) return null;
  const token = await sessionToken();
  if (!token) return null;
  try {
    return await apiSend<Candidate>("/public/candidate/me", { method: "GET", candidateSession: token });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) return null;
    console.error("[account] couldn't load the signed-in candidate", error);
    return null;
  }
}

/** Their applications (with the employer's status) and saved CV, or null when signed out or unavailable. */
export async function myApplications(): Promise<MyApplications | null> {
  if (!hasApi()) return null;
  const token = await sessionToken();
  if (!token) return null;
  try {
    return await apiSend<MyApplications>("/public/candidate/applications", { method: "GET", candidateSession: token });
  } catch (error) {
    if (!(error instanceof ApiRequestError && error.status === 401)) console.error("[account] couldn't load applications", error);
    return null;
  }
}
