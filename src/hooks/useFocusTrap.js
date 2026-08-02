import { useEffect, useRef } from "react";

/**
 * Basic focus trap for a modal/dialog. Attach the returned ref to the
 * dialog's outer container. While `active` is true: focus moves into the
 * dialog on mount, Tab/Shift+Tab cycle only among focusable elements inside
 * it, and focus returns to whatever triggered it on close.
 */
export default function useFocusTrap(active) {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    triggerRef.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    const getFocusable = () =>
      Array.from(
        container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      );

    const focusable = getFocusable();
    (focusable[0] || container).focus();

    const onKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus?.();
    };
  }, [active]);

  return containerRef;
}
