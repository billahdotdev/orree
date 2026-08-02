import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A product thumbnail that briefly enlarges when tapped, then fades out by
 * itself. Used for every product image inside the order sheet — both the
 * items being bought and the cross-sell suggestion.
 *
 * Why a self-dismissing peek rather than opening the full lightbox:
 * the order sheet is already a modal. Stacking the real ImageLightbox on top
 * would mean two dialogs fighting over the focus trap, two Escape handlers,
 * and two `body.overflow` writers — and worse, it would pull the customer
 * *out* of checkout into a browsing gesture at the exact moment they were
 * about to buy. This is a glance, not a detour: it never steals focus, never
 * touches scroll lock, and gets out of the way on its own.
 *
 * Dismisses on: the timer, any tap, Escape, or scroll. Whichever comes first.
 */

const PEEK_MS = 2400;

export default function ProductThumb({
  src,
  alt = "",
  title = "",
  size = 56,
  className = "",
  peekable = true,
}) {
  const [failed, setFailed] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const buttonRef = useRef(null);
  const timerRef = useRef(null);

  const hasImage = Boolean(src) && !failed;
  const canPeek = peekable && hasImage;

  const close = () => {
    clearTimeout(timerRef.current);
    setPeeking(false);
  };

  useEffect(() => {
    if (!peeking) return;

    timerRef.current = setTimeout(() => setPeeking(false), PEEK_MS);

    const onKey = (e) => {
      if (e.key === "Escape") {
        // Stop the sheet's own Escape handler from also firing — a peek
        // should never close the whole checkout underneath it.
        e.stopPropagation();
        close();
      }
    };
    const onScroll = () => close();

    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });

    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [peeking]);

  // Return focus where it came from, so keyboard users aren't dropped at the
  // top of the sheet.
  useEffect(() => {
    if (!peeking && buttonRef.current === document.activeElement) return;
    if (!peeking) buttonRef.current?.focus?.({ preventScroll: true });
  }, [peeking]);

  const box = (
    <div
      className="h-full w-full overflow-hidden rounded-xl bg-green-soft"
      style={{ width: size, height: size }}
    >
      {hasImage ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center font-display text-[20px] font-bold text-cream/20"
        >
          {String(title || alt).trim().charAt(0)}
        </span>
      )}
    </div>
  );

  // No photo, or peeking disabled: render a plain, non-interactive box so
  // nothing looks tappable when there is nothing to show.
  if (!canPeek) {
    return <div className={`shrink-0 ${className}`}>{box}</div>;
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setPeeking(true)}
        aria-label={`${title || alt} — ছবি বড় করে দেখুন`}
        className={`shrink-0 overflow-hidden rounded-xl transition-transform active:scale-95 ${className}`}
      >
        {box}
      </button>

      {peeking &&
        createPortal(
          <div
            // Above the order sheet (z-100) and the lightbox (z-120).
            className="fixed inset-0 z-[130] flex items-center justify-center p-8"
            onClick={close}
            onPointerDown={close}
          >
            {/* sheet-backdrop is a pure opacity fade. The obvious pick,
                animate-fade-up, also translates 24px — on a full-bleed fixed
                backdrop that leaves a visible gap along the bottom edge for
                the length of the animation.
                Both classes are no-ops under prefers-reduced-motion; the
                global reset in index.css collapses their durations. */}
            <span
              aria-hidden="true"
              className="sheet-backdrop absolute inset-0 bg-green-deeper/70 backdrop-blur-sm"
            />
            <figure className="animate-toast-in relative flex max-h-full flex-col items-center gap-3">
              <img
                src={src}
                alt={alt}
                className="max-h-[52vh] max-w-[76vw] rounded-2xl object-contain shadow-glass"
              />
              {title && (
                <figcaption className="font-display text-[14px] font-medium text-cream/85">{title}</figcaption>
              )}
            </figure>
          </div>,
          document.body
        )}
    </>
  );
}
