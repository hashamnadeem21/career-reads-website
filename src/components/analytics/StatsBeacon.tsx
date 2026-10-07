"use client";

import { useEffect, type AnchorHTMLAttributes } from "react";

/**
 * Privacy-friendly counters for the admin dashboard: sends only the page path and
 * an event kind. No cookies, no IDs, no IP storage (see /api/stats).
 */
export type StatKind = "view" | "apply_click";

const sent = new Set<string>();

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
