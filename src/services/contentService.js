/**
 * Content service — talks to the Apps Script backend for product data.
 *
 * Read path:  site loads → fetchProducts() → if the sheet has content, use
 *             it; otherwise fall back to the defaults bundled in siteData.js.
 *             This means the site NEVER breaks if the backend is down or
 *             not configured yet — it just shows the built-in products.
 *
 * Write path: the admin panel sends the password with every save. The
 *             password is never stored in the site bundle; it's typed by
 *             the admin and verified server-side, so a tampered frontend
 *             still can't write anything.
 */

const ENDPOINT = import.meta.env.VITE_SHEETS_WEBHOOK_URL || "";

export const isBackendConfigured = () => !!ENDPOINT;

/**
 * Apps Script Web Apps redirect to a googleusercontent.com URL and don't
 * send CORS headers on the initial response. A plain GET follows that
 * redirect fine, which is why reads work but writes need the no-cors trick.
 */
export async function fetchProducts() {
  if (!ENDPOINT) return null;
  try {
    const res = await fetch(`${ENDPOINT}?action=products`);
    const data = await res.json();
    return data.status === "success" && Array.isArray(data.products) ? data.products : null;
  } catch {
    return null; // Offline / misconfigured — caller falls back to defaults.
  }
}

/**
 * Loads everything editable — products, campaigns and site content — in a
 * single request on boot. Any piece the backend hasn't got yet comes back
 * null and the caller keeps the built-in defaults, so the site never breaks
 * when the backend is down or not configured.
 */
export async function fetchSiteContent() {
  if (!ENDPOINT) return { products: null, campaigns: null, site: null };
  try {
    const res = await fetch(`${ENDPOINT}?action=all`);
    const data = await res.json();
    if (data.status !== "success") return { products: null, campaigns: null, site: null };
    return {
      products: Array.isArray(data.products) ? data.products : null,
      campaigns: Array.isArray(data.campaigns) ? data.campaigns : null,
      site: data.site && typeof data.site === "object" ? data.site : null,
    };
  } catch {
    return { products: null, campaigns: null, site: null };
  }
}

/**
 * Verifies the admin password against the server. Uses a real (readable)
 * response, so we know whether it was accepted.
 */
export async function verifyPassword(password) {
  if (!ENDPOINT) return { ok: false, message: "ব্যাকএন্ড কনফিগার করা হয়নি (VITE_SHEETS_WEBHOOK_URL)" };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "verifyPassword", password }),
    });
    const data = await res.json();
    return { ok: data.status === "success", message: data.message || "" };
  } catch (err) {
    return { ok: false, message: "সার্ভারে পৌঁছানো যায়নি — ইন্টারনেট সংযোগ দেখুন" };
  }
}

export async function saveProducts(products, password) {
  return postSave({ action: "saveProducts", password, products });
}

export async function saveCampaigns(campaigns, password) {
  return postSave({ action: "saveCampaigns", password, campaigns });
}

export async function saveSite(site, password) {
  return postSave({ action: "saveSite", password, site });
}

async function postSave(payload) {
  if (!ENDPOINT) return { ok: false, message: "ব্যাকএন্ড কনফিগার করা হয়নি" };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: data.status === "success", message: data.message || "" };
  } catch (err) {
    return { ok: false, message: "সেভ করা যায়নি — আবার চেষ্টা করুন" };
  }
}
