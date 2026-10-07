"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/** Distance kept free above an anchor target so the sticky header never covers it. */
const ANCHOR_OFFSET = -96;

/**
 * Smooth, inertial page scrolling (mouse wheel and trackpad; touch keeps the
 * device's native feel). Turned off entirely for visitors who ask their OS to
 * reduce motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: true, lerp: 0.1 });

    // Same-page links (#section, table of contents, skip link) glide instead of jumping.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href*='#']");
      if (!link) return;
      const url = new URL(link.href);
      if (url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      event.preventDefault();
      history.pushState(null, "", url.hash);
      // Measure from the live scroll position: Lenis' own copy can lag behind a native scroll.
      lenis.scrollTo(target.getBoundingClientRect().top + window.scrollY + ANCHOR_OFFSET);
      // Move keyboard focus too, like a normal anchor jump would.
      if (!target.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);

    // Pause while an overlay (e.g. the mobile menu) locks page scrolling.
    const observer = new MutationObserver(() => {
      if (document.body.style.overflow === "hidden") lenis.stop();
      else lenis.start();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    return () => {
      document.removeEventListener("click", onClick);
      observer.disconnect();
      lenis.destroy();
    };
  }, []);

  return null;
}
