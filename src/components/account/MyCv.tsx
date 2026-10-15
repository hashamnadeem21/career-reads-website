"use client";

import { CheckCircle2, Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useId, useRef, useState, useTransition } from "react";
import { removeCv, uploadCv } from "@/app/account/actions";
import { CV_ACCEPT } from "@/lib/apply/limits";
import { fileSize, shortDate } from "@/lib/candidate/application-status";
import type { AuthResult, SavedCv } from "@/lib/candidate/types";

const button =
  "inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition hover:bg-surface disabled:opacity-60";

/**
 * The CV saved on their account. Choosing a file uploads it straight away (no extra Save step);
 * it's offered next time they apply. Applications already sent keep the CV they went with.
 */
export function MyCv({ cv }: { cv: SavedCv | null }) {
  const id = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  /** The last upload's or removal's outcome. */
  const [notice, setNotice] = useState<AuthResult | null>(null);
  const [, upload, uploading] = useActionState(async (prev: AuthResult | null, formData: FormData) => {
    const result = await uploadCv(prev, formData);
    setNotice(result);
    if (result.status === "success") router.refresh();
    return result;
  }, null);
  const [confirming, setConfirming] = useState(false);
  const [removing, startRemove] = useTransition();
  const busy = uploading || removing;

  const remove = () =>
    startRemove(async () => {
      const result = await removeCv();
      setNotice(result);
      setConfirming(false);
      if (result.status === "success") router.refresh();
    });

  const message = uploading ? null : notice;
  const error = message?.status === "error" ? (message.fieldErrors?.cv ?? message.message) : null;

  const fileInput = (
    <input
      name="cv"
      type="file"
      accept={CV_ACCEPT}
      className="sr-only"
      disabled={busy}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      onChange={(event) => {
        if (event.currentTarget.files?.length) formRef.current?.requestSubmit();
      }}
    />
  );
  const focusRing = "focus-within:ring-2 focus-within:ring-brand/40";

  return (
    <section className="mt-8" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-xl font-semibold">
        <FileText className="h-5 w-5 text-link" aria-hidden /> My CV
      </h2>
      <div className="mt-4 rounded-2xl border border-border bg-background p-4 sm:p-5">
        <form ref={formRef} action={upload} onSubmit={() => setNotice(null)}>
          {cv ? (
            <>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface">
                  <FileText className="h-5 w-5 text-link" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium" data-testid="saved-cv-name">
                    {cv.name}
                  </p>
                  <p className="text-sm text-muted">
                    {fileSize(cv.sizeBytes)} · Uploaded {shortDate(cv.uploadedAt)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted">We&apos;ll use this CV when you apply for a job. You can still choose a different one each time.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="/account/cv" target="_blank" rel="noopener" className={button}>
                  <Eye className="h-4 w-4" aria-hidden /> View
                </a>
                <label className={`${button} ${focusRing} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
                  {uploading ? "Uploading…" : "Upload a new CV"}
                  {fileInput}
                </label>
                {!confirming && (
                  <button type="button" className={`${button} text-rose-700 dark:text-rose-300`} disabled={busy} onClick={() => setConfirming(true)}>
                    <Trash2 className="h-4 w-4" aria-hidden /> Remove
                  </button>
                )}
              </div>
              {confirming && (
                <div className="mt-4 rounded-xl bg-rose-500/10 p-4 text-sm">
                  <p>Remove your CV from your account? Applications you&apos;ve already sent keep their CV.</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={remove}
                      disabled={busy}
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-rose-600 px-4 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      {removing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Remove
                    </button>
                    <button type="button" onClick={() => setConfirming(false)} className={button.replace("h-10", "h-9")}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <label
              className={`${focusRing} flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-8 text-center transition hover:border-brand hover:bg-surface ${busy ? "pointer-events-none opacity-60" : ""}`}
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-link" aria-hidden /> : <Upload className="h-6 w-6 text-link" aria-hidden />}
              <span className="font-medium">{uploading ? "Uploading…" : "Upload your CV"}</span>
              <span className="text-sm text-muted">PDF or Word (.docx), up to 4 MB. Saved for your next application.</span>
              {fileInput}
            </label>
          )}
        </form>
        {message?.status === "error" && (
          <p id={`${id}-error`} role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        {message?.status === "success" && message.message && (
          <p role="status" className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> {message.message}
          </p>
        )}
      </div>
    </section>
  );
}
