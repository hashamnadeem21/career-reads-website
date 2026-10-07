"use client";

import { Menu, Search, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isActivePath, type NavItem } from "./NavLinks";

export function MobileNav({ items, categories }: { items: readonly NavItem[]; categories: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the menu after navigation (adjusting state during render, per React docs).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
        data-testid="mobile-menu-button"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            data-lenis-prevent
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-border bg-background/98 px-4 pb-10 pt-6 backdrop-blur"
          >
            <Link
              href="/search"
              className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-muted"
            >
              <Search className="h-4 w-4" aria-hidden />
              Search articles…
            </Link>
            <nav aria-label="Mobile">
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                      className={cn(
                        "block rounded-xl px-3 py-3 font-display text-2xl",
                        isActivePath(pathname, item.href) ? "text-link" : "text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="eyebrow mt-8 mb-3 px-3">Categories</p>
              <ul className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      className="block rounded-xl border border-border px-3 py-2.5 text-sm font-medium hover:border-brand"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
