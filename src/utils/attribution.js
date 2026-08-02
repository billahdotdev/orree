/**
 * Campaign attribution — which ad actually produced this order.
 *
 * THE GAP THIS CLOSES
 *
 * Before this, an order recorded `source: "lp-candy"` and nothing else. That
 * tells you the product page, not the ad. You could not answer any of the
 * questions that decide where budget goes: which ad set, which creative, which
 * platform, Meta or Google. Ads Manager reports conversions it *believes* it
 * caused; this records what the customer's own browser carried in, which is
 * the only version your sheet can reconcile against real deliveries.
 *
 * FIRST-TOUCH AND LAST-TOUCH, BOTH
 *
 * Bangladeshi COD buyers rarely convert on the first visit. A common path is:
 * see a Meta reel → leave → search the brand on Google days later → order.
 * Last-touch alone credits Google for demand Meta created; first-touch alone
 * ignores the ad that actually closed. Storing both is cheap and lets you
 * judge the funnel honestly.
 *
 * WINDOW
 *
 * 30 days, matching Meta's default click attribution window. Beyond that the
 * link between an ad and an order is guesswork, and stale UTMs quietly credit
 * campaigns that ended a month ago.
 *
 * PRIVACY
 *
 * Only campaign parameters and the referring hostname are stored — no page
 * history, no personal data. Everything lives in this browser's localStorage.
 */

const STORE_KEY = "orree_attribution_v1";
const WINDOW_DAYS = 30;
const WINDOW_MS = WINDOW_DAYS * 864e5;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const CLICK_IDS = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid"];

const isBrowser = () => typeof window !== "undefined";

function read() {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.first?.at) return null;
    // Expire the whole record once first-touch falls outside the window.
    if (Date.now() - parsed.first.at > WINDOW_MS) {
      localStorage.removeItem(STORE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function write(value) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(value));
  } catch {
    // Private browsing or quota. Attribution degrades to whatever the current
    // URL carries; ordering is unaffected.
  }
}

/**
 * Classifies a visit into a channel your reports can group by.
 *
 * Deliberately conservative: anything with a click ID or a paid utm_medium is
 * paid, a known search host with no click ID is organic search, a known social
 * host is organic social, any other host is referral, and no referrer at all
 * is direct. Guessing harder than this produces confident nonsense.
 */
function classify(params, referrerHost) {
  const medium = (params.utm_medium || "").toLowerCase();
  const source = (params.utm_source || "").toLowerCase();

  if (params.gclid || params.gbraid || params.wbraid) return "google_ads";
  if (params.fbclid) return "meta_ads";
  if (params.ttclid) return "tiktok_ads";
  if (params.msclkid) return "bing_ads";

  if (/^(cpc|ppc|paid|paidsocial|paid_social|display|cpm)$/.test(medium)) {
    if (/google/.test(source)) return "google_ads";
    if (/facebook|instagram|meta|fb|ig/.test(source)) return "meta_ads";
    return "paid_other";
  }

  if (!referrerHost) return medium || source ? "campaign" : "direct";
  if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(referrerHost)) return "organic_search";
  if (/facebook\.|instagram\.|t\.co|twitter\.|x\.com|tiktok\.|youtube\./.test(referrerHost)) return "organic_social";
  if (/wa\.me|whatsapp\.|web\.whatsapp/.test(referrerHost)) return "whatsapp";
  if (/m\.me|messenger\./.test(referrerHost)) return "messenger";
  return "referral";
}

function currentTouch() {
  const url = new URL(window.location.href);
  const params = {};

  for (const key of [...UTM_KEYS, ...CLICK_IDS]) {
    const value = url.searchParams.get(key);
    if (value) params[key] = value.slice(0, 200); // guard against junk-stuffed URLs
  }

  let referrerHost = "";
  try {
    const ref = document.referrer;
    if (ref) {
      const host = new URL(ref).hostname;
      // Internal navigation isn't a referral.
      if (host && host !== window.location.hostname) referrerHost = host;
    }
  } catch {
    /* malformed referrer */
  }

  return {
    ...params,
    channel: classify(params, referrerHost),
    referrer: referrerHost,
    landing: url.pathname,
    at: Date.now(),
  };
}

/** True when this visit actually carries campaign information worth storing. */
function isMeaningful(touch) {
  return Boolean(
    UTM_KEYS.some((k) => touch[k]) ||
      CLICK_IDS.some((k) => touch[k]) ||
      (touch.referrer && touch.channel !== "referral")
  );
}

/**
 * Call once on app start. Records first-touch if absent, and overwrites
 * last-touch whenever the visit carries new campaign information.
 *
 * An internal navigation or a plain refresh carries nothing and must NOT
 * overwrite last-touch — otherwise every reload would relabel a paid visit as
 * "direct" and you would lose the attribution you just paid for.
 */
export function initAttribution() {
  if (!isBrowser()) return;

  const touch = currentTouch();
  const stored = read();

  if (!stored) {
    if (isMeaningful(touch) || !touch.referrer) write({ first: touch, last: touch });
    return;
  }

  if (isMeaningful(touch)) write({ first: stored.first, last: touch });
}

/** Flat, sheet-friendly snapshot to attach to an order. */
export function getAttribution() {
  const stored = read();
  if (!stored) {
    return { channel: "direct", source: "", medium: "", campaign: "", content: "", term: "", clickId: "", firstChannel: "", firstCampaign: "", landing: isBrowser() ? window.location.pathname : "", referrer: "" };
  }

  const { first, last } = stored;
  const clickId =
    last.gclid || last.gbraid || last.wbraid || last.fbclid || last.ttclid || last.msclkid || "";

  return {
    channel: last.channel || "direct",
    source: last.utm_source || "",
    medium: last.utm_medium || "",
    campaign: last.utm_campaign || "",
    content: last.utm_content || "",
    term: last.utm_term || "",
    clickId,
    // Kept separate so you can see demand creation vs. the closing click.
    firstChannel: first.channel || "",
    firstCampaign: first.utm_campaign || "",
    landing: first.landing || "",
    referrer: last.referrer || "",
  };
}

/** Google Ads click id, for the Ads conversion tag. */
export function getGclid() {
  const stored = read();
  return stored?.last?.gclid || stored?.last?.gbraid || stored?.last?.wbraid || "";
}
