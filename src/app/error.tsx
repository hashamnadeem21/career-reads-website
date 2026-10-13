"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Shown when a page fails to load (usually the server was briefly busy). Tries once more on its
 * own, then offers "Try again", which re-fetches the page without a full reload.
 */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const retried = useRef(false);

  useEffect(() => {
    console.error(error);
    if (retried.current) return;
    retried.current = true;
    const timer = window.setTimeout(retry, 1500);
    return () => window.clearTimeout(timer);
  }, [error, retry]);

  return (
    <div className="container-page py-24 text-center" role="alert">
      <h1 className="text-4xl font-bold tracking-tight">This page didn&apos;t load</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">Something went wrong on our side. It&apos;s usually gone in a moment.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:opacity-90">
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-border px-5 py-2.5 font-semibold hover:border-brand">
          Home
        </Link>
      </div>
    </div>
  );
}
