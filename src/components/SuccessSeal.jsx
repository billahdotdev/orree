import React from "react";

/**
 * The little moment of relief after an order goes through.
 *
 * Rather than a checkmark that just appears, the ring sweeps itself closed and
 * the tick strokes in after it — the way you'd draw a seal of approval by
 * hand. A single warm glow blooms out behind it once. Restrained on purpose:
 * one gesture, warm, over in under a second, never gaudy. The two faint rings
 * ripple outward to give the moment a little air.
 *
 * Under reduced-motion the strokes render fully drawn instantly (the global
 * reduced-motion reset collapses the durations), so it stays a calm, complete
 * seal with no movement.
 */
export default function SuccessSeal() {
  return (
    <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
      {/* one-time warmth spreading behind the seal */}
      <span className="seal-warmth pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />

      {/* faint ripples for air */}
      <span className="success-ring" aria-hidden="true" />
      <span className="success-ring success-ring--2" aria-hidden="true" />

      <span className="success-badge relative flex h-16 w-16 items-center justify-center rounded-full bg-amber/12">
        <svg viewBox="0 0 52 52" className="h-9 w-9" fill="none" aria-hidden="true">
          <circle
            className="seal-circle"
            cx="26"
            cy="26"
            r="24"
            stroke="#E0661F"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            className="seal-check"
            d="M16 27.5 L23 34.5 L37 18.5"
            stroke="#E0661F"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
