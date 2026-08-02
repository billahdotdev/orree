/**
 * Cloudflare Pages Function — Meta Conversions API relay.
 *
 * Changes vs. the previous version:
 *  - Forwards the hashed user_data (ph/fn/ln/ct/country) and the fbp/fbc
 *    cookies the client now sends. Previously only IP + User-Agent went up,
 *    which caps Event Match Quality at roughly 2/10. With phone + fbp + fbc
 *    a COD store typically lands at 7-8/10, and that number is what decides
 *    whether Meta's algorithm can find more buyers like your buyers.
 *  - Falls back to reading _fbp/_fbc from the request Cookie header if the
 *    client couldn't (JS-blocked edge cases).
 *  - Re-hashes any raw PII that slips through, so a bad client build can
 *    never leak a plaintext phone number to Meta.
 *  - One retry on 5xx. Meta's edge occasionally 502s; a dropped Purchase is
 *    real money.
 *  - Optional META_TEST_EVENT_CODE so you can watch events land in the Test
 *    Events tab before trusting the pipeline.
 *
 * Required Cloudflare Pages env vars (mark Encrypted):
 *     META_PIXEL_ID        your Pixel / Dataset ID
 *     META_CAPI_TOKEN      Conversions API access token
 * Optional:
 *     META_TEST_EVENT_CODE TEST12345 — remove before scaling spend
 *
 * Without the first two this quietly 204s, so the site works pre-configuration.
 */

const GRAPH_VERSION = "v21.0";
const HASHED_KEYS = new Set(["em", "ph", "fn", "ln", "ct", "st", "zp", "country", "external_id"]);
const SHA256_HEX = /^[a-f0-9]{64}$/;

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value).trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(header, name) {
  if (!header) return undefined;
  const match = header.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

/**
 * Guarantees every identity field is a SHA-256 digest before it leaves us.
 * If the client already hashed it (it does), this is a cheap regex pass.
 */
async function normalizeUserData(incoming = {}, request) {
  const out = {};

  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined || value === null || value === "") continue;
    if (HASHED_KEYS.has(key)) {
      out[key] = SHA256_HEX.test(String(value)) ? value : await sha256Hex(value);
    } else if (key === "fbp" || key === "fbc") {
      out[key] = value; // cookies are sent raw by design
    }
  }

  const cookieHeader = request.headers.get("Cookie");
  if (!out.fbp) out.fbp = readCookie(cookieHeader, "_fbp");
  if (!out.fbc) out.fbc = readCookie(cookieHeader, "_fbc");

  const ip = request.headers.get("CF-Connecting-IP");
  const ua = request.headers.get("User-Agent");
  if (ip) out.client_ip_address = ip;
  if (ua) out.client_user_agent = ua;

  return Object.fromEntries(Object.entries(out).filter(([, v]) => v));
}

async function postToMeta(url, payload, attempt = 0) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Meta's edge 5xxs occasionally. One retry; never retry a 4xx (our bug).
  if (res.status >= 500 && attempt === 0) {
    await new Promise((r) => setTimeout(r, 250));
    return postToMeta(url, payload, 1);
  }
  return res;
}

export async function onRequestPost({ request, env }) {
  const PIXEL_ID = env.META_PIXEL_ID;
  const TOKEN = env.META_CAPI_TOKEN;

  if (!PIXEL_ID || !TOKEN) return new Response(null, { status: 204 });

  let incoming;
  try {
    incoming = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (!incoming?.event_name) return new Response("Missing event_name", { status: 400 });

  const event = {
    event_name: incoming.event_name,
    event_time: incoming.event_time || Math.floor(Date.now() / 1000),
    event_id: incoming.event_id,
    event_source_url: incoming.event_source_url,
    action_source: incoming.action_source || "website",
    user_data: await normalizeUserData(incoming.user_data, request),
    custom_data: incoming.custom_data || {},
  };

  const payload = { data: [event] };
  if (env.META_TEST_EVENT_CODE) payload.test_event_code = env.META_TEST_EVENT_CODE;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`;

  try {
    const res = await postToMeta(url, payload);
    if (!res.ok) {
      // Log the reason for yourself; never echo Meta's body (it can contain
      // token hints) back to the browser.
      console.error("CAPI rejected", res.status, await res.text());
      return new Response(null, { status: 502 });
    }
    return new Response(null, { status: 202 });
  } catch (err) {
    console.error("CAPI transport error", err);
    return new Response(null, { status: 502 });
  }
}
