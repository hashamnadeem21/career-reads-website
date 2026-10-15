"use client";

import { Briefcase, FileText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/account", label: "My applications", short: "Applications", icon: Briefcase },
  { href: "/account/cv", label: "My CV", icon: FileText },
  { href: "/account/settings", label: "Account settings", short: "Settings", icon: Settings },
] as const;

/**
 * The account dashboard's tabs: a column in the sidebar on wider screens, a row of tabs above the
 * page on phones.
 */
export function AccountNav({ applications }: { applications: number | null }) {
  const pathname = usePathname();
  return (
    <nav aria-label="My account">
      <ul className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
        {TABS.map((tab) => {
          const { href, label, icon: Icon } = tab;
          const short = "short" in tab ? tab.short : null;
          const active = href === "/account" ? pathname === "/account" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-medium transition md:gap-2.5 md:rounded-xl md:px-4",
                  active ? "bg-brand/10 text-link" : "text-muted hover:bg-surface hover:text-foreground",
                )}
              >
                <Icon className="hidden h-4 w-4 shrink-0 md:block" aria-hidden />
                {short ? (
                  <>
                    {/* Shorter on phones, so all three tabs fit in one row. */}
                    <span className="md:hidden">{short}</span>
                    <span className="hidden md:inline">{label}</span>
                  </>
                ) : (
                  label
                )}
                {href === "/account" && applications !== null && applications > 0 && (
                  <span className={cn("ml-auto rounded-full px-2 text-xs font-semibold", active ? "bg-brand/15" : "bg-surface")}>{applications}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
