import { useEffect, useRef } from "react";

const canHover = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A gentle 3D tilt toward the cursor — desktop only.
 *
 * Attach the ref to an element and, on a device that actually has a hovering
 * pointer, it leans a few degrees toward the mouse as it moves across, then
 * eases back flat when the pointer leaves. Pure `transform` on the GPU, so it
 * never touches layout. Does nothing on touch devices (where there's no
 * hover) or under reduced-motion — so phone users are entirely unaffected.
 *
 * Put this on an inner wrapper, not an element that already animates its own
 * transform (e.g. a scroll-reveal root), so the two transforms don't fight.
 */
export default function useTilt({ max = 5, lift = 6, scale = 1.01 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !canHover() || prefersReducedMotion()) return undefined;

    node.style.transformStyle = "preserve-3d";
    node.style.transition = "transform 0.4s cubic-bezier(0.16,1,0.3,1)";

    let raf = 0;
    const onMove = (e) => {
      const rect = node.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 … 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        node.style.transition = "transform 0.08s linear"; // follow the cursor closely
        node.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-${lift}px) scale(${scale})`;
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      node.style.transition = "transform 0.5s cubic-bezier(0.16,1,0.3,1)"; // ease back
      node.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateY(0) scale(1)";
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [max, lift, scale]);

  return ref;
}
