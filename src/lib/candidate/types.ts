/** A signed-in candidate, as the API returns it (safe to send to the browser). */
export interface Candidate {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  signupMethod: "google" | "password" | "apply";
  hasPassword: boolean;
  subscribed: boolean;
}

/** What a sign-in, sign-up or account action tells the form. */
export type AuthResult =
  | { status: "success"; message?: string; candidate?: Candidate; created?: boolean }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

/**
 * Only same-site paths are followed after signing in ("/jobs/x/apply", never "//evil.test" or
 * "https://…"), so a crafted link can't send people elsewhere.
 */
export function safeNext(next: unknown, fallback = "/account"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\r\n\t]/.test(next) || next.length > 300) return fallback;
  return next;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
