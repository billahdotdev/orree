import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ZoomIn, RotateCcw } from "lucide-react";
import useFocusTrap from "../hooks/useFocusTrap.js";

/**
 * Fullscreen photo viewer.
 *
 * Gestures, in the order people actually reach for them on a phone:
 *   • swipe left/right  → previous / next photo (only while not zoomed in)
 *   • double-tap        → zoom to 2.5× at the tapped spot, tap again to reset
 *   • pinch             → free zoom 1×–4×, anchored between the fingers
 *   • drag while zoomed → pan, clamped so the photo can never fly off screen
 * On desktop: arrow keys, +/− and 0, the scroll wheel, and Esc.
 *
 * Rendered through a portal because the product card it is opened from has
 * `overflow-hidden` — without the portal the viewer would be clipped inside
 * a 200px-tall card.
 *
 * The transform is written straight to the node during a gesture instead of
 * going through React state. A pinch fires dozens of moves per second and a
 * re-render per move drops frames on the mid-range Androids most of our
 * customers are on.
 */

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const distanceOf = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const midpointOf = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * `onOrder` is optional. When passed, the bottom rail grows an order CTA.
 *
 * Rationale: a customer who has opened the lightbox and pinch-zoomed into the
 * product is at the highest-intent moment on the page — they are inspecting
 * the thing, not browsing it. Previously the only way out of that state was to
 * close, scroll back, and find the button again, and every one of those steps
 * sheds people.
 *
 * Placement is deliberate. The CTA lives in the bottom rail, OUTSIDE the pan
 * and pinch surface, so it can never be triggered by a stray drag and never
 * covers the image the customer is studying. It stays visible while zoomed
 * rather than hiding, because zoomed *is* the high-intent state.
 */
export default function ImageLightbox({ images, startIndex = 0, title = "", onClose, onOrder, orderLabel = "এখনই অর্ডার করুন" }) {
  const [index, setIndex] = useState(() => clamp(startIndex, 0, Math.max(0, images.length - 1)));
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const dialogRef = useFocusTrap(true);
  const stageRef = useRef(null);
  const imgRef = useRef(null);

  const view = useRef({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const drag = useRef(null);
  const lastTap = useRef({ t: 0, x: 0, y: 0 });

  const multiple = images.length > 1;

  const applyTransform = useCallback((animate = false) => {
    const el = imgRef.current;
    if (!el) return;
    const { scale, x, y } = view.current;
    el.style.transition =
      animate && !reducedMotion() ? "transform 260ms cubic-bezier(0.16,1,0.3,1)" : "none";
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);

  const clampPan = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    const { scale } = view.current;
    const maxX = Math.max(0, (el.offsetWidth * (scale - 1)) / 2);
    const maxY = Math.max(0, (el.offsetHeight * (scale - 1)) / 2);
    view.current.x = clamp(view.current.x, -maxX, maxX);
    view.current.y = clamp(view.current.y, -maxY, maxY);
  }, []);

  const resetView = useCallback(
    (animate = true) => {
      view.current = { scale: 1, x: 0, y: 0 };
      setZoomed(false);
      applyTransform(animate);
    },
    [applyTransform]
  );

  /** Zooms towards a screen point, so the pixel under the finger stays put. */
  const zoomTo = useCallback(
    (next, clientX, clientY, animate = true) => {
      const el = imgRef.current;
      if (!el) return;
      const previous = view.current.scale;
      const scale = clamp(next, MIN_SCALE, MAX_SCALE);
      if (Math.abs(scale - previous) < 0.001) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const fx = typeof clientX === "number" ? clientX : cx;
      const fy = typeof clientY === "number" ? clientY : cy;
      const ratio = scale / previous;

      view.current.scale = scale;
      view.current.x -= (fx - cx) * (ratio - 1);
      view.current.y -= (fy - cy) * (ratio - 1);
      clampPan();
      setZoomed(scale > 1.01);
      applyTransform(animate);
    },
    [applyTransform, clampPan]
  );

  const goTo = useCallback(
    (next) => {
      if (!multiple) return;
      setIndex(((next % images.length) + images.length) % images.length);
      setLoaded(false);
      view.current = { scale: 1, x: 0, y: 0 };
      setZoomed(false);
      applyTransform(false);
    },
    [applyTransform, images.length, multiple]
  );

  // ── gestures ──────────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    if (e.target.closest?.("[data-lb-control]")) return; // let buttons be buttons
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const rect = imgRef.current?.getBoundingClientRect();
      pinch.current = {
        startDist: distanceOf(a, b) || 1,
        startMid: midpointOf(a, b),
        startScale: view.current.scale,
        startX: view.current.x,
        startY: view.current.y,
        startCx: rect ? rect.left + rect.width / 2 : 0,
        startCy: rect ? rect.top + rect.height / 2 : 0,
      };
      drag.current = null;
    } else if (pointers.current.size === 1) {
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, moved: 0 };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    const previous = pointers.current.get(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const g = pinch.current;
      const scale = clamp((g.startScale * distanceOf(a, b)) / g.startDist, MIN_SCALE, MAX_SCALE);
      const m = midpointOf(a, b);
      const ratio = scale / g.startScale;

      view.current.scale = scale;
      view.current.x = g.startX + (m.x - g.startMid.x) - (g.startMid.x - g.startCx) * (ratio - 1);
      view.current.y = g.startY + (m.y - g.startMid.y) - (g.startMid.y - g.startCy) * (ratio - 1);
      clampPan();
      applyTransform(false);
      setZoomed(scale > 1.01);
      return;
    }

    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;

    d.dx = e.clientX - d.x;
    d.dy = e.clientY - d.y;
    d.moved = Math.max(d.moved, Math.hypot(d.dx, d.dy));

    if (view.current.scale > 1.01) {
      view.current.x += e.clientX - previous.x;
      view.current.y += e.clientY - previous.y;
      clampPan();
      applyTransform(false);
    } else if (multiple && Math.abs(d.dx) > Math.abs(d.dy)) {
      // Rubber-band the photo with the finger so the swipe feels answered.
      view.current.x = d.dx * 0.35;
      applyTransform(false);
    }
  };

  const onPointerEnd = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;

    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;

    const isTap = d.moved < 10;

    if (view.current.scale <= 1.01) {
      const width = stageRef.current?.clientWidth || 320;
      const threshold = Math.min(90, width * 0.18);
      if (!isTap && Math.abs(d.dx) > threshold && Math.abs(d.dx) > Math.abs(d.dy)) {
        goTo(index + (d.dx < 0 ? 1 : -1));
        return;
      }
      view.current.x = 0;
      view.current.y = 0;
      applyTransform(true);
    }

    if (!isTap) return;

    const now = Date.now();
    const previousTap = lastTap.current;
    const isDoubleTap =
      now - previousTap.t < 320 &&
      Math.hypot(e.clientX - previousTap.x, e.clientY - previousTap.y) < 30;

    lastTap.current = isDoubleTap ? { t: 0, x: 0, y: 0 } : { t: now, x: e.clientX, y: e.clientY };

    if (isDoubleTap) {
      if (view.current.scale > 1.01) resetView(true);
      else zoomTo(DOUBLE_TAP_SCALE, e.clientX, e.clientY, true);
    }
  };

  // Wheel zoom needs a non-passive listener to be able to preventDefault.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      zoomTo(view.current.scale * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY, false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomTo]);

  // Re-registered every render on purpose — keeps `index` fresh without deps juggling.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        goTo(index + 1);
      } else if (e.key === "ArrowLeft") {
        goTo(index - 1);
      } else if (e.key === "+" || e.key === "=") {
        zoomTo(view.current.scale + 0.5);
      } else if (e.key === "-") {
        zoomTo(view.current.scale - 0.5);
      } else if (e.key === "0") {
        resetView();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // The page behind must not scroll while the viewer is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    applyTransform(false);
  }, [index, applyTransform]);

  const label = title ? `${title} — ছবি ${index + 1}` : `ছবি ${index + 1}`;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title || "প্রোডাক্টের"} ছবি`}
      tabIndex={-1}
      className="fixed inset-0 z-[120] flex flex-col bg-green-deeper/96 backdrop-blur-xl outline-none animate-fade-up"
    >
      {/* top bar */}
      <div className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-7">
        <p className="min-w-0 truncate font-display text-[14.5px] font-medium text-cream/80">{label}</p>
        <div className="flex items-center gap-2 shrink-0">
          {zoomed && (
            <button
              type="button"
              data-lb-control
              onClick={() => resetView(true)}
              className="tap flex h-10 items-center gap-1.5 rounded-full border border-cream/15 px-4 text-[13px] text-cream/70 hover:text-amber"
            >
              <RotateCcw size={14} />
              আগের মাপে
            </button>
          )}
          <button
            type="button"
            data-lb-control
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="tap flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 text-cream/75 hover:border-amber/50 hover:text-amber"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* stage */}
      <div
        ref={stageRef}
        data-no-bloom
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={(e) => {
          if (e.target === stageRef.current) onClose();
        }}
        className="relative flex flex-1 touch-none select-none items-center justify-center overflow-hidden px-4 py-4 sm:px-16"
      >
        <img
          ref={imgRef}
          key={images[index]}
          src={images[index]}
          alt={label}
          draggable={false}
          onLoad={() => setLoaded(true)}
          style={{ transformOrigin: "center center", cursor: zoomed ? "grab" : "zoom-in" }}
          className={`max-h-full max-w-full object-contain will-change-transform ${
            loaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-500`}
        />

        {!loaded && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-9 w-9 animate-spin rounded-full border-2 border-cream/20 border-t-amber"
          />
        )}

        {multiple && (
          <>
            <button
              type="button"
              data-lb-control
              onClick={() => goTo(index - 1)}
              aria-label="আগের ছবি"
              className="tap absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/15 bg-green-deep/60 text-cream/75 backdrop-blur hover:border-amber/50 hover:text-amber sm:flex"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              data-lb-control
              onClick={() => goTo(index + 1)}
              aria-label="পরের ছবি"
              className="tap absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/15 bg-green-deep/60 text-cream/75 backdrop-blur hover:border-amber/50 hover:text-amber sm:flex"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* bottom rail */}
      <div className="px-5 pb-6 pt-3 sm:px-7">
        {multiple && (
          <div className="no-scrollbar mb-3 flex snap-x gap-2.5 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                data-lb-control
                onClick={() => goTo(i)}
                aria-label={`ছবি ${i + 1} দেখুন`}
                aria-current={i === index}
                className={`h-14 w-14 shrink-0 snap-start overflow-hidden rounded-xl border transition-colors ${
                  i === index ? "border-amber" : "border-cream/15 hover:border-cream/35"
                }`}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {onOrder && (
          <button
            type="button"
            data-lb-control
            onClick={() => {
              onClose();
              onOrder();
            }}
            className="tap mb-3 flex w-full items-center justify-center rounded-full bg-amber py-3.5 font-display font-semibold text-cream shadow-amber-glow transition-transform active:scale-[0.98]"
          >
            {orderLabel}
          </button>
        )}

        <p className="flex items-center justify-center gap-2 text-center text-[12px] text-cream/45">
          <ZoomIn size={13} className="shrink-0" />
          <span className="sm:hidden">দুইবার ট্যাপ বা দুই আঙুলে জুম{multiple ? " · পাশে সোয়াইপ" : ""}</span>
          <span className="hidden sm:inline">
            ডাবল-ক্লিক বা স্ক্রল করে জুম{multiple ? " · তীর চিহ্নে পরের ছবি" : ""} · Esc দিয়ে বন্ধ
          </span>
        </p>
      </div>
    </div>,
    document.body
  );
}
