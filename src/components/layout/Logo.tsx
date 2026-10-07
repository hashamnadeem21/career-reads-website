import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Inline SVG mark — no network request, crisp at any size, theme-independent. */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id="cr-mark-bg" x1="6" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#cr-mark-bg)" />
      {/* Briefcase (jobs) with an open, bookmarked book on its face (articles). */}
      <path
        d="M24.5 21.5v-2.6a3.4 3.4 0 0 1 3.4-3.4h8.2a3.4 3.4 0 0 1 3.4 3.4v2.6"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <rect x="10" y="21" width="44" height="30" rx="7" fill="#fff" />
      <path d="M32 45.2c-4.3-2.6-9-3.5-14.2-2.9V29.2c5.2-.6 9.9.3 14.2 2.9z" fill="#2563EB" />
      <path d="M32 45.2c4.3-2.6 9-3.5 14.2-2.9V29.2c-5.2-.6-9.9.3-14.2 2.9z" fill="#0EA5E9" />
      <path d="M30.4 32.3v9.6l1.6-1.2 1.6 1.2v-9.6z" fill="#F59E0B" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <LogoMark className="h-9 w-9 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
      <span className="whitespace-nowrap font-display text-[1.4rem] font-extrabold leading-none tracking-tight">
        Career <span className="text-gradient">Reads</span>
      </span>
    </Link>
  );
}
