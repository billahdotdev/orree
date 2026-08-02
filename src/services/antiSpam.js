/**
 * Client-side spam friction.
 *
 * These checks are a convenience layer, NOT security — anyone can clear
 * localStorage or edit the JS. The real enforcement lives in the Apps
 * Script (phone-based rate limiting + duplicate detection), which runs on
 * Google's servers where a visitor has no control.
 *
 * The design rule here: a genuine customer must never notice any of this.
 * The cooldown only trips on a repeat submit within 90 seconds, which no
 * real person placing a second, different order would realistically hit.
 */

const COOLDOWN_KEY = "orree_last_order_at";
const COOLDOWN_SECONDS = 90;

/** Returns seconds remaining, or 0 if the customer is free to order. */
export function getCooldownRemaining() {
  try {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    if (!last) return 0;
    const elapsed = (Date.now() - last) / 1000;
    return elapsed >= COOLDOWN_SECONDS ? 0 : Math.ceil(COOLDOWN_SECONDS - elapsed);
  } catch {
    return 0;
  }
}

export function startCooldown() {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    // Storage blocked — server-side limits still apply, so this is fine.
  }
}
