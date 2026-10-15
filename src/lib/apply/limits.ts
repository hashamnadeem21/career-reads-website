/**
 * The website's CV limit. The API takes 5 MB, but Vercel refuses requests to the site's functions
 * over 4.5 MB, so the form stops at 4 MB (plenty: most CVs are well under 1 MB).
 */
export const MAX_CV_BYTES = 4 * 1024 * 1024;
/** PDF and Word .docx only: old .doc files can carry macros, so the API refuses them. */
export const CV_ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface ApplyResult {
  /**
   * success: sent to the employer. held: waits until they confirm their email. already_applied:
   * one application per job. signed_out: their session ended, so they sign in again.
   */
  status: "success" | "held" | "already_applied" | "signed_out" | "error";
  message: string;
  /** Field errors from the API, keyed like its fields (`answers.<question id>` for answers). */
  fieldErrors?: Record<string, string>;
}
