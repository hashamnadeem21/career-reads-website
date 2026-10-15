import type { MyApplication } from "./types";

export type StatusTone = "waiting" | "sent" | "progress" | "good" | "closed";

export interface StatusView {
  label: string;
  /** One plain sentence on what it means for them. */
  hint: string;
  tone: StatusTone;
}

/**
 * How an application's status reads to the candidate. The employer's wording (the admin's
 * "Rejected", say) is kept kind and plain here.
 */
export function applicationStatus(application: Pick<MyApplication, "status" | "awaitingConfirmation">): StatusView {
  if (application.awaitingConfirmation) {
    return { label: "Confirm your email", hint: "Not sent yet. It goes to the employer as soon as you confirm your email.", tone: "waiting" };
  }
  switch (application.status) {
    case "new":
      return { label: "Sent", hint: "The employer has your application.", tone: "sent" };
    case "reviewed":
      return { label: "Reviewed", hint: "The employer has looked at your application.", tone: "progress" };
    case "shortlisted":
      return { label: "Shortlisted", hint: "Good news: you're on the employer's shortlist.", tone: "progress" };
    case "interviewing":
      return { label: "Interview", hint: "The employer wants to interview you. Keep an eye on your email and phone.", tone: "progress" };
    case "offered":
      return { label: "Offer", hint: "The employer has made you an offer.", tone: "good" };
    case "hired":
      return { label: "Hired", hint: "Congratulations on the new job!", tone: "good" };
    case "rejected":
      return { label: "Not selected", hint: "The employer went with other candidates this time.", tone: "closed" };
    case "withdrawn":
      return { label: "Withdrawn", hint: "This application is closed.", tone: "closed" };
  }
}

/** "12 Oct 2026" */
export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "240 KB", "1.2 MB" */
export function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
