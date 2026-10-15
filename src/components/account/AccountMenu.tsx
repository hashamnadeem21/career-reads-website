"use client";

import { Briefcase, FileText, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { signOut } from "@/app/account/actions";
import { ACCOUNT_CHANGED } from "./AuthPanel";
import { Avatar } from "./Avatar";

interface Me {
  name: string;
  email: string;
  avatarUrl: string | null;
}

/**
 * The header's account button. It asks /api/candidate/me in the browser, so every page stays
 * static; signed out it's a "Sign in" link, signed in a menu with the account page and sign-out.
 */
export function AccountMenu({ variant = "header" }: { variant?: "header" | "mobile" }) {
  const [state, setState] = useState<{ enabled: boolean; me: Me | null } | null>(null);
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const load = useCallback(() => {
    fetch("/api/candidate/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { enabled: boolean; candidate: Me | null } | null) => setState(data ? { enabled: data.enabled, me: data.candidate } : null))
      .catch(() => setState(null));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(ACCOUNT_CHANGED, load);
    return () => window.removeEventListener(ACCOUNT_CHANGED, load);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!state?.enabled) return null;

  if (variant === "mobile") {
    const next = pathname.startsWith("/account") ? "/account" : pathname;
    return (
      <Link
        href={state.me ? "/account" : `/account/sign-in?mode=signin&next=${encodeURIComponent(next)}`}
        className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
        data-testid="mobile-account-link"
      >
        {state.me ? <Avatar name={state.me.name} url={state.me.avatarUrl} size={28} /> : <UserRound className="h-5 w-5 text-muted" aria-hidden />}
        <span className="min-w-0">
          <span className="block truncate font-medium">{state.me ? state.me.name : "Sign in"}</span>
          <span className="block truncate text-sm text-muted">{state.me ? "My account" : "To apply for jobs on Career Reads"}</span>
        </span>
      </Link>
    );
  }

  if (!state.me) {
    const next = pathname.startsWith("/account") ? "/account" : pathname;
    return (
      <Link
        href={`/account/sign-in?mode=signin&next=${encodeURIComponent(next)}`}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-medium transition-colors hover:border-brand sm:px-4"
        data-testid="sign-in-link"
      >
        <UserRound className="h-[18px] w-[18px]" aria-hidden />
        <span className="hidden sm:inline">Sign in</span>
        <span className="sr-only sm:hidden">Sign in</span>
      </Link>
    );
  }

  const me = state.me;
  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account: ${me.name}`}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-colors hover:border-brand"
        data-testid="account-menu-button"
      >
        <Avatar name={me.name} url={me.avatarUrl} size={30} />
      </button>
      {open && (
        <div id={menuId} className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-border bg-background p-2 shadow-xl">
          <div className="px-3 py-2">
            <p className="truncate font-semibold">{me.name}</p>
            <p className="truncate text-sm text-muted">{me.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          {[
            { href: "/account", label: "My applications", Icon: Briefcase },
            { href: "/account/cv", label: "My CV", Icon: FileText },
            { href: "/account/settings", label: "Account settings", Icon: Settings },
          ].map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface">
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </Link>
          ))}
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={() =>
              start(async () => {
                await signOut();
                setOpen(false);
                setState((s) => (s ? { ...s, me: null } : s));
                if (pathname.startsWith("/account")) router.replace("/");
                router.refresh();
              })
            }
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
