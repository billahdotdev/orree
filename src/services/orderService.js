/**
 * Order submission — the single choke point between checkout UI and storage.
 *
 * Changes vs. the previous version:
 *
 *  1. DELIVERY ZONES. A flat ৳80 nationwide fee is the number-one cause of
 *     COD refusal-at-the-door in Bangladesh: the courier quotes ৳130 for a
 *     Rangpur drop, the customer was promised ৳80, and they refuse the parcel.
 *     You eat the return freight and the customer never buys again. Quote the
 *     real zone price on the page and that failure mode disappears.
 *  2. Request timeout. A hung fetch on spotty 4G used to leave the submit
 *     button spinning forever with no fallback path. 12s ceiling, then the
 *     honest error UI takes over.
 *  3. One silent retry on network failure before declaring defeat.
 *
 * Order shape is unchanged apart from `customer.zone` and `deliveryZone`,
 * both additive.
 */

import { getAttribution } from "../utils/attribution.js";

const SHEETS_WEBHOOK_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL || "";
const REQUEST_TIMEOUT_MS = 12000;

export const DELIVERY_ZONES = [
  { id: "inside_dhaka", label: "ঢাকার ভিতরে", note: "১-২ দিনে ডেলিভারি" },
  { id: "outside_dhaka", label: "ঢাকার বাইরে", note: "২-৪ দিনে ডেলিভারি" },
];

/**
 * Reward code for the customer's NEXT order.
 *
 * Derived from the order ID rather than random, on purpose: your team can
 * verify any code a customer reads out over the phone by finding that order
 * in the sheet — no separate coupon database, no lookup table, nothing extra
 * to keep in sync. ORR-482913-K7M2P → ORREE10-K7M2P.
 *
 * It is deliberately NOT unguessable. The value here is repeat-purchase
 * warmth and a trackable identifier, not fraud prevention; the offer costs
 * you 10% of product cost on an order you would not otherwise have had.
 */
export function buildRewardCode(orderId, prefix = "ORREE10") {
  const tail = String(orderId || "").split("-").pop() || "";
  return tail ? `${prefix}-${tail}` : "";
}

function makeOrderId() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ORR-${Date.now().toString().slice(-6)}-${rand}`;
}

/**
 * Zone-aware delivery pricing.
 *
 * Accepts the new shape { insideDhaka, outsideDhaka, freeThreshold } and
 * still honours the legacy { flatFee, freeThreshold } so nothing breaks
 * mid-deploy while you update siteData.js / the admin panel.
 */
export function getDeliveryFee(subtotal, shipping, zone = "inside_dhaka") {
  if (!shipping) return 0;
  if (shipping.freeThreshold && subtotal >= shipping.freeThreshold) return 0;

  if (zone === "outside_dhaka" && typeof shipping.outsideDhaka === "number") return shipping.outsideDhaka;
  if (zone === "inside_dhaka" && typeof shipping.insideDhaka === "number") return shipping.insideDhaka;
  return shipping.flatFee ?? 0;
}

export function buildOrder({ items, totalPrice, form, shipping, channel, source, zone = "inside_dhaka", rewardPrefix }) {
  const deliveryFee = getDeliveryFee(totalPrice, shipping, zone);
  const id = makeOrderId();
  return {
    id,
    // Which ad produced this order. Lands in the sheet as its own columns, so
    // you can total real, delivered revenue by campaign — the number Ads
    // Manager cannot give you, because it counts orders placed, not orders
    // that survived the doorstep.
    attribution: getAttribution(),
    rewardCode: buildRewardCode(id, rewardPrefix),
    createdAt: new Date().toISOString(),
    customer: {
      name: form.name,
      phone: form.phone,
      address: form.address,
      // Feeds Meta advanced matching (hashed as `ct`) and gives your ops team
      // the courier zone without parsing a free-text address.
      zone,
      city: zone === "inside_dhaka" ? "dhaka" : "",
    },
    items: items.map((i) => ({ id: i.id, name: i.title, price: i.price, quantity: i.qty })),
    subtotal: totalPrice,
    deliveryFee,
    deliveryZone: zone,
    total: totalPrice + deliveryFee,
    currency: "BDT",
    paymentMethod: "cod",
    channel,
    source: source || (typeof window !== "undefined" ? window.location.pathname : ""),
  };
}

export function buildOrderMessage(order) {
  const zoneLabel = DELIVERY_ZONES.find((z) => z.id === order.deliveryZone)?.label || "";
  return [
    `আসসালামু আলাইকুম, Orree থেকে অর্ডার করতে চাই।`,
    ``,
    `অর্ডার নং: ${order.id}`,
    `নাম: ${order.customer.name}`,
    `ফোন: ${order.customer.phone}`,
    `ঠিকানা: ${order.customer.address}`,
    zoneLabel ? `এলাকা: ${zoneLabel}` : "",
    ``,
    `অর্ডার:`,
    ...order.items.map((i) => `- ${i.name} × ${i.quantity} = ৳${i.price * i.quantity}`),
    ``,
    `সাবটোটাল: ৳${order.subtotal}`,
    order.deliveryFee > 0 ? `ডেলিভারি চার্জ: ৳${order.deliveryFee}` : `ডেলিভারি চার্জ: ফ্রি`,
    `সর্বমোট: ৳${order.total}`,
    `পেমেন্ট: ক্যাশ অন ডেলিভারি`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildWhatsAppUrl(message, whatsappNumber) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Sends the order to the backend and REPORTS BACK whether it actually landed.
 *
 * We deliberately avoid `mode: "no-cors"`: an opaque response would force us
 * to show "order placed!" even when nothing was stored. For COD, silently
 * losing an order is far worse than an honest error with a WhatsApp escape
 * hatch. `Content-Type: text/plain` keeps this a simple request so the
 * browser skips the preflight Apps Script cannot answer.
 */
async function postOrder(payload, attempt = 0) {
  if (!SHEETS_WEBHOOK_URL) return { saved: false, reason: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal,
    });
    const data = await res.json();
    return { saved: data.status === "success", reason: data.message || "" };
  } catch {
    // One retry — a single dropped packet on a Dhaka cell handover shouldn't
    // cost you the order. Never retry twice; the customer is waiting.
    if (attempt === 0) return postOrder(payload, 1);
    return { saved: false, reason: "network" };
  } finally {
    clearTimeout(timer);
  }
}

export async function submitOrder({
  items, totalPrice, form, shipping, channel = "whatsapp", source,
  honeypot, secondsOnForm, turnstileToken, zone = "inside_dhaka", rewardPrefix,
}) {
  const order = buildOrder({ items, totalPrice, form, shipping, channel, source, zone, rewardPrefix });

  // Anti-spam signals ride along but aren't part of the stored record.
  const result = await postOrder({
    ...order,
    honeypot: honeypot || "",
    secondsOnForm,
    turnstileToken: turnstileToken || "",
  });

  return { order, message: buildOrderMessage(order), saved: result.saved, reason: result.reason };
}
