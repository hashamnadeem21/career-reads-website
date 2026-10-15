"use client";

import { CheckCircle2, Loader2, Newspaper, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { subscribeToJobAlerts } from "@/app/account/actions";
import { pauseSubscribePrompt, shouldPromptSubscribe } from "@/lib/candidate/subscribe-prompt";
import { primaryButton } from "./AuthPanel";

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * Offered once an application is sent: one click adds them to the newsletter (no extra email:
 * they've had the welcome email). Not shown to subscribers; "Not now" waits 30 days.
 */
export function SubscribeDialog({ subscribed }: { subscribed: boolean }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!shouldPromptSubscribe(subscribed, storage())) return;
    const timer = window.setTimeout(() => {
      opener.current = document.activeElement;
      setOpen(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [subscribed]);

  const close = (remember: boolean) => {
    if (remember) pauseSubscribePrompt(storage());
    setOpen(false);
    (opener.current as HTMLElement | null)?.focus?.();
  };

  useEffect(() => {
    if (!open) return;
    dialog.current?.querySelector<HTMLElement>("button[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(!done);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, done]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && close(!done)}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-title"
        className="relative w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl sm:p-8"
        data-testid="subscribe-dialog"
      >
        <button type="button" onClick={() => close(!done)} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-surface hover:text-foreground">
          <X className="h-5 w-5" aria-hidden />
        </button>
        {done ? (
          <div role="status" className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden />
            <h2 id="subscribe-title" className="mt-4 text-xl font-bold">You&apos;re subscribed</h2>
            <p className="mt-2 text-muted">Look out for our next newsletter. Every email has a link to unsubscribe.</p>
            <button type="button" data-autofocus onClick={() => close(false)} className={`${primaryButton} mt-6`}>
              Done
            </button>
          </div>
        ) : (
          <>
            <Newspaper className="h-10 w-10 text-link" aria-hidden />
            <h2 id="subscribe-title" className="mt-4 text-xl font-bold">Want more jobs like this?</h2>
            <p className="mt-2 text-muted">Get new jobs and practical career advice from Career Reads in your inbox. Unsubscribe any time.</p>
            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                {error}
              </p>
            )}
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                data-autofocus
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await subscribeToJobAlerts();
                    if (result.status === "success") setDone(true);
                    else setError(result.message);
                  })
                }
                className={primaryButton}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Subscribe
              </button>
              <button type="button" onClick={() => close(true)} className="h-11 rounded-full text-sm font-semibold text-muted hover:text-foreground">
                Not now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
