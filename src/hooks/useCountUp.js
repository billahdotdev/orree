import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts a number up from 0 to `target`, eased with an ease-out cubic so it
 * decelerates naturally. Two ways to trigger it:
 *
 *   • Default — attach the returned `ref` to an element and it starts the
 *     first time that element scrolls into view (self-contained).
 *   • `active` — pass a boolean and it starts when that flips true. Use this
 *     when several counters should fire off one shared visibility trigger
 *     (e.g. a rating and its review count in the same badge).
 *
 * Honours reduced-motion (jumps to the final value) and cancels its frame on
 * unmount.
 */
export default function useCountUp(target, { duration = 1100, decimals = 0, active } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);
  const doneRef = useRef(false);
  const controlled = active !== undefined;

  useEffect(() => {
    const end = Number(target) || 0;

    const run = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      if (prefersReducedMotion()) {
        setValue(end);
        return;
      }
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = end * eased;
        setValue(decimals ? Math.round(current * 10 ** decimals) / 10 ** decimals : Math.round(current));
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else setValue(end);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    // Controlled mode: fire when `active` turns true.
    if (controlled) {
      if (active) run();
      return () => cancelAnimationFrame(rafRef.current);
    }

    // Self-contained mode: observe our own element.
    const node = ref.current;
    if (!node) {
      setValue(end);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          observer.unobserve(node);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, decimals, active, controlled]);

  return { ref, value };
}
