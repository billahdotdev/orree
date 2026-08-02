import React, { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const isTurnstileEnabled = () => !!SITE_KEY;

/** Loads the Turnstile script once, shared across every mount. */
let scriptPromise = null;
function loadTurnstileScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error("Turnstile script failed to load"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Invisible-by-default bot check.
 *
 * For a real customer this renders nothing visible and silently hands us a
 * token — no puzzles, no "select all traffic lights". Only genuinely
 * suspicious traffic ever sees an interactive challenge, which is exactly
 * the trade-off we want: friction for bots, none for buyers.
 *
 * The token is single-use and expires after ~5 minutes, so we expose a
 * `resetRef` the parent calls after a failed submit to get a fresh one.
 */
export default function TurnstileWidget({ onToken, resetRef }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;

    let cancelled = false;

    loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;

        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: "dark",
          size: "flexible",
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });

        if (resetRef) {
          resetRef.current = () => {
            try {
              window.turnstile?.reset(widgetIdRef.current);
              onToken("");
            } catch {
              // Widget already gone — nothing to reset.
            }
          };
        }
      })
      .catch(() => {
        // Script blocked (ad blocker, offline). We deliberately do NOT block
        // checkout here — the server still runs its own spam checks, and
        // losing a real order is worse than letting one bot through.
        onToken("unavailable");
      });

    return () => {
      cancelled = true;
      try {
        if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
      } catch {
        // Already removed.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className="flex justify-center min-h-[65px]" />;
}
