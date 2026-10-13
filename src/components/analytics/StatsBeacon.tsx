"use client";

import { useEffect, type AnchorHTMLAttributes } from "react";

/**
 * Privacy-friendly counters for the admin dashboard: sends only the page path and
 * an event kind. No cookies, no IDs, no IP storage (see /api/stats).
 */
export type StatKind = "view" | "apply_click" | "visit";

const sent = new Set<string>();

/** How often an open tab says "still here". The API counts a tab as online for 45 seconds. */
const HEARTBEAT_MS = 20_000;
const VISIT_KEY = "cr-visit-counted";

export function sendStat(path: string, kind: StatKind): void {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
  const body = new Blob([JSON.stringify({ path, kind })], { type: "application/json" });
  navigator.sendBeacon("/api/stats", body);
}

/** Counts one view per page load (React strict mode runs effects twice in dev). */
export function StatsBeacon({ path }: { path: string }) {
  useEffect(() => {
    if (sent.has(path)) return;
    sent.add(path);
    sendStat(path, "view");
  }, [path]);
  return null;
}

/** A link that also counts an `apply_click` for the job page it lives on. */
export function TrackedApplyLink({ statPath, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { statPath: string }) {
  return <a {...props} onClick={(e) => (sendStat(statPath, "apply_click"), props.onClick?.(e))} />;
}

function sendPresence(id: string, leave: boolean): void {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
  const body = new Blob([JSON.stringify(leave ? { id, leave } : { id })], { type: "application/json" });
  navigator.sendBeacon("/api/presence", body);
}

/**
 * Site-wide, in the root layout: counts one `visit` per browser tab session (sessionStorage, not a
 * cookie) and keeps the admin's "Online now" count live. The tab's id lives in memory only; it
 * leaves when the tab closes or goes to the background, and comes back when it's visible again.
 */
export function SiteTracker() {
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(VISIT_KEY)) {
        sessionStorage.setItem(VISIT_KEY, "1");
        sendStat("/", "visit");
      }
    } catch {
      // Storage blocked: skip the visit count rather than count every page.
    }

    if (typeof crypto === "undefined" || !crypto.randomUUID) return;
    const id = crypto.randomUUID();
    let timer: number | undefined;
    const start = () => {
      if (timer !== undefined) return;
      sendPresence(id, false);
      timer = window.setInterval(() => sendPresence(id, false), HEARTBEAT_MS);
    };
    const stop = () => {
      if (timer === undefined) return;
      window.clearInterval(timer);
      timer = undefined;
      sendPresence(id, true);
    };
    const sync = () => (document.visibilityState === "visible" ? start() : stop());

    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pagehide", stop);
    window.addEventListener("pageshow", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("pageshow", sync);
      stop();
    };
  }, []);
  return null;
}
