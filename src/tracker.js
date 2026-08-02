/**
 * Central tracking layer — GA4 (gtag), Meta Pixel, Conversions API (CAPI).
 *
 * What changed vs. the previous version, and why it matters for Meta ads:
 *
 *  1. _fbp / _fbc are now captured and forwarded to CAPI. Without them, Meta
 *     cannot join a server event to the browser session — Event Match Quality
 *     collapses to ~2/10 and the algorithm never learns who converts.
 *  2. fbclid is read from the landing URL and written into a _fbc cookie
 *     ourselves. ~25-35% of BD mobile traffic blocks or delays fbevents.js;
 *     those users used to be completely unattributable. Now they aren't.
 *  3. Customer name/phone/city are SHA-256 hashed IN THE BROWSER and sent as
 *     Meta advanced-matching keys. For COD this is the single biggest EMQ win
 *     available — phone is the one identifier every BD customer gives you.
 *     Raw PII never leaves the device.
 *  4. Purchase uses the ORDER ID as event_id. Idempotent: a retry, a refresh,
 *     or a duplicate Pixel+CAPI pair all collapse to one conversion.
 *  5. GA4 items now use the real GA4 ecommerce schema (item_id/item_name).
 *     The old shape silently produced item-less revenue reports.
 *  6. Meta events carry `contents` + `content_type: "product"` — required for
 *     catalogue matching and dynamic retargeting.
 *
 * Nothing here throws if gtag/fbq are missing (ad blockers, local dev).
 */

import { initAttribution as initCampaignAttribution } from "./utils/attribution.js";

const CAPI_ENDPOINT = "/api/capi";
const FBC_COOKIE_DAYS = 90;

const isBrowser = typeof window !== "undefined";
const hasGtag = () => isBrowser && typeof window.gtag === "function";
const hasFbq = () => isBrowser && typeof window.fbq === "function";

/* ───────────────────────────── identity ───────────────────────────── */

function readCookie(name) {
  if (!isBrowser) return "";
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : "";
}

function writeCookie(name, value, days) {
  if (!isBrowser) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

/**
 * Meta's click ID. If fbevents.js hasn't set _fbc yet (blocked, slow 4G, or
 * still loading) we build it from the fbclid query param exactly the way the
 * Pixel would: fb.1.<unix_ms>.<fbclid>. Persisted so it survives the whole
 * session, including the WhatsApp round-trip.
 */
export function getFbc() {
  const existing = readCookie("_fbc");
  if (existing) return existing;
  if (!isBrowser) return "";

  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return "";

  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  writeCookie("_fbc", fbc, FBC_COOKIE_DAYS);
  return fbc;
}

export function getFbp() {
  return readCookie("_fbp");
}

/**
 * Call once, as early as possible.
 *  - getFbc() guarantees a _fbc cookie even when fbevents.js is blocked.
 *  - initCampaignAttribution() records UTM / gclid / referrer so an order can
 *    name the ad set and creative that produced it, not just the product page.
 */
export function initAttribution() {
  getFbc();
  initCampaignAttribution();
}

/* ─────────────────────────── hashing (PII) ────────────────────────── */

async function sha256(value) {
  if (!value) return undefined;
  if (!isBrowser || !window.crypto?.subtle) return undefined;
  const bytes = new TextEncoder().encode(String(value).trim().toLowerCase());
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Meta wants BD numbers as 8801XXXXXXXXX — no +, no spaces, country code on. */
function toE164Bd(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  if (digits.length === 10) return `880${digits}`;
  return digits;
}

/**
 * Builds Meta advanced-matching user_data. Everything identifying is hashed
 * here, in the browser — the server relay only ever sees digests.
 */
export async function buildUserData(customer = {}) {
  const nameParts = String(customer.name || "").trim().split(/\s+/);
  const [ph, fn, ln, ct] = await Promise.all([
    sha256(toE164Bd(customer.phone)),
    sha256(nameParts[0]),
    sha256(nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""),
    sha256(customer.city),
  ]);

  const data = { ph, fn, ln, ct, country: await sha256("bd") };
  const fbp = getFbp();
  const fbc = getFbc();
  if (fbp) data.fbp = fbp;
  if (fbc) data.fbc = fbc;

  // Strip undefined so we never send empty hash slots.
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v));
}

/* ─────────────────────────────── core ─────────────────────────────── */

function makeEventId() {
  if (isBrowser && crypto?.randomUUID) return crypto.randomUUID();
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function sendCapiEvent(eventName, customData, eventId, userData) {
  const body = JSON.stringify({
    event_name: eventName,
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: isBrowser ? window.location.href : undefined,
    action_source: "website",
    user_data: userData || { fbp: getFbp() || undefined, fbc: getFbc() || undefined },
    custom_data: customData,
  });

  if (import.meta.env?.DEV) {
    console.debug("tracker/capi →", eventName, JSON.parse(body));
    return;
  }

  // sendBeacon survives the page unload that follows a WhatsApp/Messenger
  // handoff — the exact moment a Purchase would otherwise be lost.
  if (isBrowser && navigator.sendBeacon) {
    const ok = navigator.sendBeacon(CAPI_ENDPOINT, new Blob([body], { type: "application/json" }));
    if (ok) return;
  }
  fetch(CAPI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Fires one logical event across GA4, Pixel and CAPI, sharing an event_id so
 * Meta deduplicates the browser hit against the server hit.
 */
function track({ ga4Name, ga4Params = {}, fbName, fbParams = {}, eventId, userData }) {
  const id = eventId || makeEventId();

  if (ga4Name && hasGtag()) window.gtag("event", ga4Name, ga4Params);
  if (fbName && hasFbq()) window.fbq("track", fbName, fbParams, { eventID: id });
  if (fbName) sendCapiEvent(fbName, fbParams, id, userData);

  return id;
}

/** Custom (non-standard) events — GA4 + Meta trackCustom, no CAPI noise. */
function trackCustom(name, params = {}) {
  if (hasGtag()) window.gtag("event", name, params);
  if (hasFbq()) window.fbq("trackCustom", name, params);
}

/* ─────────────────────────── shape helpers ────────────────────────── */

const ga4Items = (items) =>
  items.map((i) => ({
    item_id: i.id,
    item_name: i.title || i.name,
    price: i.price,
    quantity: i.qty ?? i.quantity ?? 1,
  }));

const fbContents = (items) =>
  items.map((i) => ({
    id: i.id,
    quantity: i.qty ?? i.quantity ?? 1,
    item_price: i.price,
  }));

/* ───────────────────────────── page views ─────────────────────────── */

let firstPageViewSkipped = false;

/**
 * SPA route-change page view.
 *
 * index.html already fires the initial fbq PageView on script load, so the
 * very first call here must NOT fire a second one — that duplicate was
 * inflating Landing Page Views in Ads Manager and depressing every
 * conversion-rate column that divides by it.
 */
export function trackPageView(path, title) {
  if (hasGtag()) window.gtag("event", "page_view", { page_path: path, page_title: title });

  if (!firstPageViewSkipped) {
    firstPageViewSkipped = true;
    return;
  }
  if (hasFbq()) window.fbq("track", "PageView");
}

/* ──────────────────────────── funnel events ───────────────────────── */

const viewedProducts = new Set();

export function trackViewProduct(product) {
  if (viewedProducts.has(product.id)) return; // once per product per session
  viewedProducts.add(product.id);

  track({
    ga4Name: "view_item",
    ga4Params: { currency: "BDT", value: product.price, items: ga4Items([product]) },
    fbName: "ViewContent",
    fbParams: {
      content_ids: [product.id],
      content_name: product.title,
      content_type: "product",
      contents: fbContents([{ ...product, qty: 1 }]),
      value: product.price,
      currency: "BDT",
    },
  });
}

export function trackAddToCart(product, qty = 1) {
  const value = product.price * qty;
  track({
    ga4Name: "add_to_cart",
    ga4Params: { currency: "BDT", value, items: ga4Items([{ ...product, qty }]) },
    fbName: "AddToCart",
    fbParams: {
      content_ids: [product.id],
      content_name: product.title,
      content_type: "product",
      contents: fbContents([{ ...product, qty }]),
      value,
      currency: "BDT",
    },
  });
}

/** Fires when the order sheet opens — top of the COD checkout funnel. */
export function trackBeginCheckout(items, totalPrice) {
  if (!items?.length) return;
  track({
    ga4Name: "begin_checkout",
    ga4Params: { currency: "BDT", value: totalPrice, items: ga4Items(items) },
    fbName: "InitiateCheckout",
    fbParams: {
      content_ids: items.map((i) => i.id),
      content_type: "product",
      contents: fbContents(items),
      value: totalPrice,
      currency: "BDT",
      num_items: items.reduce((n, i) => n + (i.qty ?? 1), 0),
    },
  });
}

/**
 * COD conversion. Async because we hash the customer's phone/name first —
 * await it, or fire-and-forget; either is safe.
 *
 * event_id === order.id makes this idempotent. Two taps, a retry after a
 * flaky Grameenphone connection, or a Pixel+CAPI pair all resolve to exactly
 * one Purchase in Events Manager.
 */
/**
 * Google Ads conversion.
 *
 * GA4's `purchase` event does NOT feed Google Ads bidding on its own — Ads
 * needs its own conversion tag against an AW- id and a conversion label.
 * Without this, Smart Bidding and Performance Max have nothing to optimise
 * toward and will spend against clicks rather than orders.
 *
 * `transaction_id` is the order id, so Ads deduplicates a refresh or a retry
 * exactly the way Meta does with event_id.
 */
function trackGoogleAdsConversion(order) {
  const adsId = import.meta.env?.VITE_GOOGLE_ADS_ID;
  const label = import.meta.env?.VITE_GOOGLE_ADS_PURCHASE_LABEL;
  if (!adsId || !label || !hasGtag()) return;

  window.gtag("event", "conversion", {
    send_to: `${adsId}/${label}`,
    value: order.total,
    currency: "BDT",
    transaction_id: order.id,
  });
}

export async function trackOrderPlaced(order) {
  const userData = await buildUserData({
    name: order.customer?.name,
    phone: order.customer?.phone,
    city: order.customer?.city || order.customer?.zone,
  });

  trackGoogleAdsConversion(order);

  return track({
    eventId: order.id,
    userData,
    ga4Name: "purchase",
    ga4Params: {
      transaction_id: order.id,
      currency: "BDT",
      value: order.total,
      shipping: order.deliveryFee,
      items: ga4Items(order.items),
    },
    fbName: "Purchase",
    fbParams: {
      content_ids: order.items.map((i) => i.id),
      content_type: "product",
      contents: fbContents(order.items),
      value: order.total,
      currency: "BDT",
      num_items: order.items.reduce((n, i) => n + (i.quantity ?? 1), 0),
      order_id: order.id,
    },
  });
}

/* ───────────────────────── engagement signals ─────────────────────── */

export function trackWhatsAppClick(source) {
  track({ ga4Name: "whatsapp_click", ga4Params: { source }, fbName: "Contact", fbParams: { content_name: `whatsapp_${source}` } });
}

export function trackMessengerClick(source) {
  track({ ga4Name: "messenger_click", ga4Params: { source }, fbName: "Contact", fbParams: { content_name: `messenger_${source}` } });
}

export function trackCallClick(source) {
  track({ ga4Name: "call_click", ga4Params: { source }, fbName: "Contact", fbParams: { content_name: `call_${source}` } });
}

export function trackFaqOpen(question) {
  trackCustom("faq_open", { question });
}

/** Every primary/secondary CTA — tells you which button actually earns money. */
/**
 * Copying the next-order code is the strongest repeat-intent signal you get.
 * Build a custom audience on it — these people have already paid once and
 * have just told you they intend to come back.
 */
export function trackRewardCopy(code) {
  trackCustom("reward_code_copied", { code });
}

/**
 * Which add-ons get waved away. If one product is dismissed far more than the
 * others, the problem is usually the offer or the price, not the placement.
 */
export function trackCrossSellDismiss(productId) {
  trackCustom("cross_sell_dismissed", { product_id: productId });
}

export function trackCtaClick(label, location) {
  trackCustom("cta_click", { cta_label: label, cta_location: location });
}

export function trackGalleryView(productId, index) {
  trackCustom("gallery_view", { product_id: productId, image_index: index });
}

export function trackVideoPlay(productId, videoId) {
  trackCustom("video_play", { product_id: productId, video_id: videoId });
}

/**
 * Scroll depth at 25/50/75/90%. Passive listener + rAF throttle, so this
 * costs nothing on the main thread. Deep-scroll-no-order is your best
 * retargeting audience — these are people who read everything and hesitated.
 */
export function initScrollDepth() {
  if (!isBrowser) return () => {};
  const marks = [25, 50, 75, 90];
  const hit = new Set();
  let ticking = false;

  const measure = () => {
    ticking = false;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const pct = Math.round((window.scrollY / scrollable) * 100);

    for (const m of marks) {
      if (pct >= m && !hit.has(m)) {
        hit.add(m);
        trackCustom("scroll_depth", { percent: m, page_path: window.location.pathname });
      }
    }
    if (hit.size === marks.length) cleanup();
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(measure);
  };

  const cleanup = () => window.removeEventListener("scroll", onScroll);
  window.addEventListener("scroll", onScroll, { passive: true });
  return cleanup;
}
