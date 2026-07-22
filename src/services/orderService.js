/**
 * Order submission — single choke point between the checkout UI and
 * wherever orders actually go. Today that's "open a pre-filled WhatsApp
 * chat." Tomorrow, swap the body of submitOrder() for a real API call
 * (e.g. POST /api/orders to your backend/database) — OrderForm.jsx never
 * needs to change.
 *
 * Order shape (kept stable so a future backend has a predictable contract):
 * {
 *   id: string,
 *   createdAt: string (ISO),
 *   customer: { name, phone, address, note },
 *   items: [{ id, name, price, quantity }],
 *   total: number,
 *   currency: "BDT",
 *   paymentMethod: "cod",
 *   channel: "whatsapp" | "api"
 * }
 */

function makeOrderId() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ORR-${Date.now().toString().slice(-6)}-${rand}`;
}

export function buildOrder({ items, totalPrice, form }) {
  return {
    id: makeOrderId(),
    createdAt: new Date().toISOString(),
    customer: { name: form.name, phone: form.phone, address: form.address, note: form.note || null },
    items: items.map((i) => ({ id: i.id, name: i.title, price: i.price, quantity: i.qty })),
    total: totalPrice,
    currency: "BDT",
    paymentMethod: "cod",
    channel: "whatsapp",
  };
}

function buildWhatsAppMessage(order, whatsappNumber) {
  const lines = [
    `আসসালামু আলাইকুম, Orree থেকে অর্ডার করতে চাই।`,
    ``,
    `অর্ডার নং: ${order.id}`,
    `নাম: ${order.customer.name}`,
    `ফোন: ${order.customer.phone}`,
    `ঠিকানা: ${order.customer.address}`,
    order.customer.note ? `নোট: ${order.customer.note}` : null,
    ``,
    `অর্ডার:`,
    ...order.items.map((i) => `- ${i.name} × ${i.quantity} = ৳${i.price * i.quantity}`),
    ``,
    `সর্বমোট: ৳${order.total}`,
    `পেমেন্ট: ক্যাশ অন ডেলিভারি`,
  ].filter(Boolean);

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/**
 * Submits an order. Returns { order, redirectUrl }.
 * TODO (backend integration): replace the WhatsApp-only path with:
 *   await fetch("/api/orders", { method: "POST", body: JSON.stringify(order) })
 * and keep the WhatsApp link as a fallback/confirmation channel.
 */
export async function submitOrder({ items, totalPrice, form, whatsappNumber }) {
  const order = buildOrder({ items, totalPrice, form });
  const redirectUrl = buildWhatsAppMessage(order, whatsappNumber);
  return { order, redirectUrl };
}
