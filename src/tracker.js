/**
 * Central tracking layer — GA4 (gtag), Meta Pixel, and Conversions API (CAPI).
 *
 * Setup checklist before going live:
 *  1. In index.html, replace G-XXXXXXXXXX (GA4) and 0000000000000000 (Pixel)
 *     with your real IDs.
 *  2. Point CAPI_ENDPOINT below at your backend route, which should forward
 *     the event server-side to Meta's Conversions API using your access token.
 *  3. Every browser event and its CAPI twin share the same `event_id` —
 *     this is required for Meta to deduplicate Pixel + CAPI hits correctly.
 *
 * Nothing in this file throws if GA4/Pixel scripts haven't loaded (e.g. ad
 * blockers, local dev) — every call is guarded.
 */

const CAPI_ENDPOINT = "/api/capi"; // swap for your real backend route

const hasGtag = () => typeof window !== "undefined" && typeof window.gtag === "function";
const hasFbq = () => typeof window !== "undefined" && typeof window.fbq === "function";

function makeEventId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function sendCapiEvent(eventName, payload, eventId) {
  const body = JSON.stringify({
    event_name: eventName,
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: typeof window !== "undefined" ? window.location.href : undefined,
    action_source: "website",
    custom_data: payload,
  });

  if (import.meta.env?.DEV) {
    console.debug("[tracker:capi]", eventName, JSON.parse(body));
    return;
  }

  // navigator.sendBeacon survives page unload (e.g. right after a WhatsApp redirect)
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(CAPI_ENDPOINT, new Blob([body], { type: "application/json" }));
  } else {
    fetch(CAPI_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(
      () => {}
    );
  }
}

/** Fires one event across GA4, Pixel, and CAPI with a shared event_id for dedup. */
function track(eventName, gtagParams = {}, fbqName = null, fbqParams = {}) {
  const eventId = makeEventId();

  if (hasGtag()) window.gtag("event", eventName, gtagParams);
  if (fbqName && hasFbq()) window.fbq("track", fbqName, fbqParams, { eventID: eventId });
  sendCapiEvent(fbqName || eventName, { ...gtagParams, ...fbqParams }, eventId);

  return eventId;
}

/** Call on every route change in a SPA — GA4 config has send_page_view: false, so this is required. */
export function trackPageView(path, title) {
  if (hasGtag()) window.gtag("event", "page_view", { page_path: path, page_title: title });
  if (hasFbq()) window.fbq("track", "PageView");
}

export function trackViewProduct(product) {
  track(
    "view_item",
    { item_id: product.id, item_name: product.title, price: product.price, currency: "BDT" },
    "ViewContent",
    { content_ids: [product.id], content_name: product.title, value: product.price, currency: "BDT" }
  );
}

export function trackAddToCart(product, qty = 1) {
  track(
    "add_to_cart",
    { item_id: product.id, item_name: product.title, quantity: qty, price: product.price, currency: "BDT" },
    "AddToCart",
    { content_ids: [product.id], content_name: product.title, value: product.price * qty, currency: "BDT" }
  );
}

/** Fires when the order form/cart drawer opens — top of the checkout funnel. */
export function trackBeginCheckout(items, totalPrice) {
  track(
    "begin_checkout",
    { value: totalPrice, currency: "BDT", items: items.map((i) => ({ item_id: i.id, item_name: i.title })) },
    "InitiateCheckout",
    { content_ids: items.map((i) => i.id), value: totalPrice, currency: "BDT", num_items: items.length }
  );
}

export function trackOrderPlaced(order) {
  track(
    "purchase",
    { value: order.total, currency: "BDT", items: order.items, transaction_id: order.id },
    "Purchase",
    { value: order.total, currency: "BDT", content_ids: order.items.map((i) => i.id) }
  );
}

export function trackWhatsAppClick(source) {
  track("whatsapp_click", { source }, "Lead", { content_name: `whatsapp_${source}` });
}

export function trackFaqOpen(question) {
  track("faq_open", { question });
}
