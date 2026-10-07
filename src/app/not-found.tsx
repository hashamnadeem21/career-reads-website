import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-sm font-semibold text-link">404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">This page flew the nest</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Try one of these instead:
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:opacity-90">
          Home
        </Link>
        <Link href="/jobs" className="rounded-lg border border-border px-5 py-2.5 font-semibold hover:border-brand">
          Browse jobs
        </Link>
        <Link href="/blog" className="rounded-lg border border-border px-5 py-2.5 font-semibold hover:border-brand">
          Read the blog
        </Link>
      </div>
    </div>
  );
}
