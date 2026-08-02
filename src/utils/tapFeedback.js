/**
 * Orree's touch — a site-wide layer of tactile feedback.
 *
 * The idea: every deliberate tap or click should give something small back,
 * so the whole site feels *alive under the finger* rather than flat. Three
 * quiet signals, none of them loud enough to notice consciously — which is
 * the point. They add up to a feeling of care.
 *
 *   1. A soft "bloom" — a warm radial glow that swells out from the exact
 *      point touched and fades, echoing the element's own colour (amber for
 *      the primary CTAs, cream for everything else). Not a hard Material
 *      ripple; more like warmth spreading from a touch.
 *   2. A whisper of haptic on phones that support it (Android) — a 6ms tick
 *      on a tap, a gentler double-pulse for a completed order. iOS silently
 *      skips it; the bloom and the press-spring carry the feel there.
 *   3. The press-spring itself lives in CSS (.tap / .btn-amber :active).
 *
 * One delegated listener drives all of it — no per-component wiring — and the
 * whole thing disables under prefers-reduced-motion. Elements (or their
 * ancestors) marked [data-no-bloom] opt out, so swipe surfaces like the photo
 * gallery don't flash on every drag-start.
 */

const INTERACTIVE = "button, a[href], [role='button'], .tap, .btn-amber, .btn-outline, input[type='submit'], input[type='button'], label[role='button']";

let started = false;
let layer = null;

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const coarse = () =>
  typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

/** A short, respectful vibration. Safe no-op where unsupported (iOS, desktop). */
export function haptic(kind = "tick") {
  if (!coarse()) return; // never buzz a mouse
  if (reduced()) return; // some users are sensitive to any feedback
  const patterns = {
    tick: 6, // a light press
    soft: 4, // barely-there confirmation
    success: [11, 34, 16], // a warmer two-beat for a placed order
  };
  try {
    navigator.vibrate?.(patterns[kind] ?? patterns.tick);
  } catch {
    /* some browsers throw outside a user gesture — ignore */
  }
}

function ensureLayer() {
  if (layer) return layer;
  layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden;contain:strict";
  document.body.appendChild(layer);
  return layer;
}

function bloom(x, y, amber) {
  const el = document.createElement("span");
  el.className = `tap-bloom${amber ? " tap-bloom--amber" : ""}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  ensureLayer().appendChild(el);
  // Remove after the animation so the layer never accumulates nodes.
  el.addEventListener("animationend", () => el.remove(), { once: true });
  // Safety net in case the animationend event is missed (e.g. tab blur).
  setTimeout(() => el.remove(), 700);
}

function onPointerDown(e) {
  // Only primary presses; ignore right-click / middle-click.
  if (e.button && e.button !== 0) return;

  const target = e.target?.closest?.(INTERACTIVE);
  if (!target || target.disabled) return;
  if (target.closest("[data-no-bloom]")) {
    // Still give a faint haptic on real controls inside opt-out zones.
    if (target.matches("button, .btn-amber")) haptic("soft");
    return;
  }

  if (!reduced()) {
    const amber = target.classList.contains("btn-amber") || target.dataset.bloom === "amber";
    bloom(e.clientX, e.clientY, amber);
  }

  // A tick only for genuine buttons/CTAs — not every link — so it stays a
  // treat rather than a constant buzz.
  if (target.matches("button, .btn-amber, .btn-outline, [role='button']")) {
    haptic("tick");
  }
}

/** Call once, early, from the app root. Idempotent. */
export function initTapFeedback() {
  if (started || typeof window === "undefined") return;
  started = true;
  // Capture phase so we still fire if a handler calls stopPropagation.
  document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
}
