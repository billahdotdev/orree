import { useEffect, useRef } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Subtle scroll parallax. Attach the returned ref to an element and it drifts
 * vertically as the page scrolls, at `speed`× the scroll distance (0.1 = very
 * gentle). Purely `transform: translate3d`, so it stays on the GPU compositor
 * and never triggers layout.
 *
 * Writes are batched into a single requestAnimationFrame per scroll burst and
 * the listener is passive, so it never blocks touch scrolling on mobile.
 * No-ops entirely under reduced-motion.
 */
export default function useParallax(speed = 0.12, { max = 60 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return undefined;

    let ticking = false;
    const base = node.getBoundingClientRect().top + window.scrollY;

    const apply = () => {
      ticking = false;
      const delta = window.scrollY - base;
      const offset = Math.max(-max, Math.min(max, delta * speed));
      node.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed, max]);

  return ref;
}
