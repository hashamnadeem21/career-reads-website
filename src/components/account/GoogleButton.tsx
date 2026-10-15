"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

/** The parts of Google Identity Services this uses. */
interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        ux_mode?: "popup" | "redirect";
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        use_fedcm_for_button?: boolean;
      }): void;
      renderButton(element: HTMLElement, options: Record<string, string | number>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let loading: Promise<void> | null = null;

/** Loads Google's script once, and only on pages that show the button. */
function loadGoogle(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Google sign-in couldn't load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Google's own "Continue with Google" button. Google hands back a signed ID token, which the API
 * checks (signature, audience = our client ID, verified email) before signing the person in.
 * Hidden when no client ID is configured.
 */
export function GoogleButton({
  clientId,
  onCredential,
  text = "continue_with",
}: {
  clientId?: string;
  onCredential: (credential: string) => void;
  text?: "continue_with" | "signup_with" | "signin_with";
}) {
  const holder = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const { resolvedTheme } = useTheme();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    // Wait for the theme, so the button is drawn once in the right colours.
    if (!clientId || !resolvedTheme) return;
    let cancelled = false;
    loadGoogle()
      .then(() => {
        const el = holder.current;
        if (cancelled || !el || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => response.credential && callback.current(response.credential),
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_button: true,
        });
        // Google draws the button asynchronously, so each render gets a fresh box: a slower earlier
        // render lands in the detached old one instead of adding a second button.
        const box = document.createElement("div");
        el.replaceChildren(box);
        window.google.accounts.id.renderButton(box, {
          type: "standard",
          theme: resolvedTheme === "dark" ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text,
          logo_alignment: "left",
          width: Math.min(400, Math.max(240, Math.round(el.getBoundingClientRect().width))),
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId, resolvedTheme, text]);

  if (!clientId) return null;
  return (
    <div>
      {/* Light colour scheme so the browser keeps Google's iframe transparent on the dark theme (no white corners). */}
      <div ref={holder} className="flex min-h-11 w-full justify-center [color-scheme:light]" data-testid="google-button" />
      {failed && (
        <p className="mt-2 text-center text-sm text-muted">
          Google sign-in couldn&apos;t load (an ad or tracker blocker can stop it). You can use your email instead.
        </p>
      )}
    </div>
  );
}
