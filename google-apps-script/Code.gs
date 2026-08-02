/**
 * Orree — Backend (Google Apps Script)
 * ════════════════════════════════════════════════════════════════════
 * This one script does four jobs:
 *   1. Logs every order into the "Orders" sheet
 *   2. Sends you an instant Telegram notification
 *   3. Serves + saves product content (acts as your CMS)
 *   4. Blocks spam / fake orders — SERVER-SIDE, where it can't be bypassed
 *
 * ⚠️ SECURITY NOTE, PLEASE READ:
 * The website is a static site. Anything shipped to the browser can be read
 * by anyone. That's why the admin password is NEVER stored in the website
 * code — the admin types it, and THIS script verifies it before allowing any
 * write. Even if someone hacks past the login screen in their own browser,
 * they still cannot change your products without the real password.
 *
 * ── SETUP ──────────────────────────────────────────────────────────
 *  1. Create a Google Sheet → Extensions → Apps Script → paste this file.
 *  2. Set ADMIN_PASSWORD below to a long, unique password.
 *  3. (Optional) Set the Telegram values — see instructions further down.
 *  4. Deploy → New deployment → Web app
 *       Execute as: Me    |    Who has access: Anyone
 *  5. Copy the Web App URL → add as GitHub secret VITE_SHEETS_WEBHOOK_URL.
 *  6. Whenever you edit this file: Deploy → Manage deployments → pencil →
 *     Version: New version → Deploy. (Otherwise changes won't go live.)
 */

// ═══ CONFIG ═════════════════════════════════════════════════════════

/**
 * ── অ্যাডমিন পাসওয়ার্ড কীভাবে ম্যানেজ করবেন ─────────────────────────
 *
 * পাসওয়ার্ড আর কোডের ভেতরে হার্ডকোড করা নেই। এটা Apps Script-এর
 * "Script Properties"-এ সেভ থাকে — মানে পাসওয়ার্ড এই ফাইলের সোর্স কোডে
 * লেখা থাকে না, তাই কোড শেয়ার/কমিট করলেও ফাঁস হয় না।
 *
 * প্রথমবার সেট করতে (বা যেকোনো সময় বদলাতে):
 *   1. Apps Script এডিটরে উপরে ফাংশনের ড্রপডাউন থেকে `setAdminPassword`
 *      বেছে নিন → একবার Run করুন → নিচের CHANGE_ME বদলে নিজের পাসওয়ার্ড দিন।
 *      (অথবা এডিটরে ⚙️ Project Settings → Script Properties → যোগ করুন:
 *       Property = ADMIN_PASSWORD, Value = আপনার পাসওয়ার্ড।)
 *   2. লম্বা একটা প্যাসফ্রেজ দিন, যেমন: "amar-orree-2026-Khulna!"
 *   3. পাসওয়ার্ড বদলাতে চাইলে শুধু ধাপ ১ আবার করুন — সাইটের কোড বা
 *      ডিপ্লয়মেন্টে কিচ্ছু বদলাতে হবে না, সাথে সাথে নতুন পাসওয়ার্ড কার্যকর।
 *
 * সেট না করা পর্যন্ত নিচের FALLBACK ব্যবহার হয় — তাই লাইভ যাওয়ার আগে
 * অবশ্যই একবার `setAdminPassword` চালিয়ে নিজের পাসওয়ার্ড বসাবেন।
 */
const ADMIN_PASSWORD_FALLBACK = "CHANGE-THIS-TO-A-LONG-PASSWORD";

/** Run this once from the Apps Script editor to set (or change) the password. */
function setAdminPassword() {
  const NEW_PASSWORD = "CHANGE_ME"; // ← এখানে আপনার নতুন পাসওয়ার্ড লিখে Run করুন
  if (NEW_PASSWORD === "CHANGE_ME" || NEW_PASSWORD.length < 6) {
    throw new Error("আগে NEW_PASSWORD বদলে একটা আসল পাসওয়ার্ড দিন (৬+ অক্ষর)।");
  }
  PropertiesService.getScriptProperties().setProperty("ADMIN_PASSWORD", NEW_PASSWORD);
  return "✅ অ্যাডমিন পাসওয়ার্ড সেভ হয়েছে।";
}

/** Reads the live password: Script Property first, source-code fallback second. */
function getAdminPassword() {
  const stored = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  return stored || ADMIN_PASSWORD_FALLBACK;
}

/**
 * Telegram (optional but recommended):
 *  1. Message @BotFather → /newbot → copy the token he gives you
 *  2. Message your new bot once (say "hi") so it can reply to you
 *  3. Open https://api.telegram.org/bot<TOKEN>/getUpdates in a browser
 *     → find "chat":{"id":123456789 — that number is your chat id
 */
const TELEGRAM_BOT_TOKEN = "";
const TELEGRAM_CHAT_ID = "";

/** Optional email notification. Leave empty to disable. */
const ADMIN_EMAIL = "";

/**
 * Cloudflare Turnstile — invisible bot protection.
 *
 *  1. https://dash.cloudflare.com → Turnstile → Add site
 *  2. Widget mode: **Managed** (invisible for real people)
 *  3. Hostnames: add every domain the site runs on, e.g.
 *       yourusername.github.io      (testing)
 *       orree.bd                    (later, custom domain)
 *       localhost                   (local development)
 *  4. It gives you TWO keys:
 *       • Site key   → goes in GitHub secret VITE_TURNSTILE_SITE_KEY (public, safe)
 *       • Secret key → goes HERE, below (must never reach the browser)
 *
 * Leave TURNSTILE_SECRET_KEY empty and Turnstile checks are skipped —
 * the other spam rules still run.
 */
const TURNSTILE_SECRET_KEY = "";

// ═══ ANTI-SPAM RULES ════════════════════════════════════════════════
const MAX_ORDERS_PER_PHONE_PER_HOUR = 3; // a real customer rarely needs more
const DUPLICATE_WINDOW_MINUTES = 10; // identical repeat order within this = ignored
const MIN_SECONDS_ON_FORM = 3; // filled faster than this = almost certainly a bot

const ORDERS_SHEET = "Orders";
const PRODUCTS_SHEET = "Products";
const CAMPAIGNS_SHEET = "Campaigns"; // Meta-ad landing pages, edited from /admin
const SITE_SHEET = "Site"; // hero / story / brand / reviews content blob

// ═══ ROUTING ════════════════════════════════════════════════════════

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || "products";
  if (action === "products") {
    return jsonResponse({ status: "success", products: readProducts() });
  }
  if (action === "campaigns") {
    return jsonResponse({ status: "success", campaigns: readCampaigns() });
  }
  if (action === "site") {
    return jsonResponse({ status: "success", site: readSite() });
  }
  // One round trip for the whole editable site — what the app loads on boot.
  if (action === "all") {
    return jsonResponse({
      status: "success",
      products: readProducts(),
      campaigns: readCampaigns(),
      site: readSite(),
    });
  }
  return jsonResponse({ status: "error", message: "Unknown action" });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === "saveProducts") return handleSaveProducts(body);
    if (body.action === "saveCampaigns") return handleSaveCampaigns(body);
    if (body.action === "saveSite") return handleSaveSite(body);
    if (body.action === "verifyPassword") return handleVerifyPassword(body);
    return handleNewOrder(body);
  } catch (err) {
    logError(err, e);
    return jsonResponse({ status: "error", message: String(err) });
  }
}

// ═══ ADMIN AUTH ═════════════════════════════════════════════════════

function isAuthorized(body) {
  return !!body.password && body.password === getAdminPassword();
}

function handleVerifyPassword(body) {
  // Small delay makes automated password-guessing slow and unattractive.
  Utilities.sleep(600);
  if (!isAuthorized(body)) return jsonResponse({ status: "error", message: "ভুল পাসওয়ার্ড" });
  return jsonResponse({ status: "success" });
}

// ═══ PRODUCT CMS ════════════════════════════════════════════════════

function handleSaveProducts(body) {
  Utilities.sleep(600);
  if (!isAuthorized(body)) {
    return jsonResponse({ status: "error", message: "ভুল পাসওয়ার্ড — সেভ করা হয়নি" });
  }
  writeProducts(body.products || []);
  return jsonResponse({ status: "success", saved: (body.products || []).length });
}

/**
 * Products live in their own sheet as a single JSON blob per row-ish setup:
 * one cell holding the full JSON keeps edits atomic and avoids column drift
 * when you add new product fields later.
 */
function readProducts() {
  return readJsonSheet(PRODUCTS_SHEET);
}

function writeProducts(products) {
  writeJsonSheet(PRODUCTS_SHEET, products);
}

// ═══ CAMPAIGN CMS (Meta-ad landing pages) ═══════════════════════════
//
// Same one-cell-JSON pattern as products. Each campaign is a landing page
// you can spin up, edit and retire entirely from /admin — no code change,
// no redeploy — which is exactly what launching a new Meta ad offer needs.

function handleSaveCampaigns(body) {
  Utilities.sleep(600);
  if (!isAuthorized(body)) {
    return jsonResponse({ status: "error", message: "ভুল পাসওয়ার্ড — সেভ করা হয়নি" });
  }
  writeJsonSheet(CAMPAIGNS_SHEET, body.campaigns || []);
  return jsonResponse({ status: "success", saved: (body.campaigns || []).length });
}

function readCampaigns() {
  return readJsonSheet(CAMPAIGNS_SHEET);
}

// ═══ SITE CONTENT CMS (hero / story / brand / reviews) ══════════════

function handleSaveSite(body) {
  Utilities.sleep(600);
  if (!isAuthorized(body)) {
    return jsonResponse({ status: "error", message: "ভুল পাসওয়ার্ড — সেভ করা হয়নি" });
  }
  writeJsonSheet(SITE_SHEET, body.site || {});
  return jsonResponse({ status: "success" });
}

function readSite() {
  const value = readJsonSheet(SITE_SHEET);
  // Site is a single object; readJsonSheet returns null when empty.
  return value && !Array.isArray(value) ? value : null;
}

// ═══ SHARED JSON-SHEET HELPERS ══════════════════════════════════════
//
// One cell holds the whole JSON blob. Keeps edits atomic and means adding
// new fields later never causes column drift.

function readJsonSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return null; // null = "use built-in defaults"
  const raw = sheet.getRange(2, 1).getValue();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function writeJsonSheet(name, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1).setValue(name + " JSON — edited via the site's /admin panel").setFontWeight("bold");
    sheet.getRange(3, 1).setValue("⚠️ এই ঘরটা হাতে এডিট না করাই ভালো — /admin পেজ ব্যবহার করুন।");
  }
  sheet.getRange(2, 1).setValue(JSON.stringify(value));
}

// ═══ ORDERS ═════════════════════════════════════════════════════════

function handleNewOrder(data) {
  const spamCheck = detectSpam(data);
  if (spamCheck.isSpam) {
    recordRejected(data, spamCheck.reason);
    // Deliberately return "success" so a spam bot gets no feedback about
    // what tripped the filter. A real customer never sees this path.
    return jsonResponse({ status: "success", id: data.id });
  }

  const itemsText = data.items.map((i) => i.name + " ×" + i.quantity + " (৳" + i.price + ")").join(", ");
  appendOrderRow(data, itemsText);
  notifyTelegram(data, itemsText);
  notifyEmail(data, itemsText);

  return jsonResponse({ status: "success", id: data.id });
}

/**
 * Server-side spam filtering. This is the layer that actually matters —
 * the browser-side checks can be bypassed by anyone determined, but this
 * one runs on Google's servers where visitors have no control.
 */
function detectSpam(data) {
  // 0. Cloudflare Turnstile — the strongest signal, checked first.
  const turnstile = verifyTurnstile(data.turnstileToken);
  if (!turnstile.ok) return { isSpam: true, reason: "turnstile: " + turnstile.reason };

  // 1. Honeypot — an invisible form field real humans never see or fill.
  if (data.honeypot) return { isSpam: true, reason: "honeypot" };

  // 2. Submitted implausibly fast → automated.
  if (typeof data.secondsOnForm === "number" && data.secondsOnForm < MIN_SECONDS_ON_FORM) {
    return { isSpam: true, reason: "too_fast (" + data.secondsOnForm + "s)" };
  }

  // 3. Basic shape sanity — real orders always have these.
  if (!data.customer || !data.customer.phone || !data.customer.name || !data.items || !data.items.length) {
    return { isSpam: true, reason: "malformed" };
  }
  if (!/^01[3-9]\d{8}$/.test(String(data.customer.phone))) {
    return { isSpam: true, reason: "bad_phone" };
  }

  const sheet = getOrCreateOrdersSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { isSpam: false };

  // Only scan the recent tail — keeps this fast even with thousands of orders.
  const scanCount = Math.min(200, lastRow - 1);
  const rows = sheet.getRange(lastRow - scanCount + 1, 1, scanCount, 9).getValues();

  const now = new Date().getTime();
  const phone = String(data.customer.phone);
  let recentFromPhone = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowTime = rows[i][1] instanceof Date ? rows[i][1].getTime() : 0;
    const rowPhone = String(rows[i][3]).replace(/^'/, "");
    const rowTotal = rows[i][8];
    if (rowPhone !== phone) continue;

    const minutesAgo = (now - rowTime) / 60000;

    // 4. Same phone + same total, moments apart → double-tap or replay.
    if (minutesAgo <= DUPLICATE_WINDOW_MINUTES && Number(rowTotal) === Number(data.total)) {
      return { isSpam: true, reason: "duplicate" };
    }

    // 5. Same phone flooding orders within the hour.
    if (minutesAgo <= 60) recentFromPhone++;
  }

  if (recentFromPhone >= MAX_ORDERS_PER_PHONE_PER_HOUR) {
    return { isSpam: true, reason: "rate_limit (" + recentFromPhone + "/hr)" };
  }

  return { isSpam: false };
}

/**
 * Verifies a Turnstile token with Cloudflare. This is the step that makes
 * Turnstile meaningful — the widget alone proves nothing, since anyone can
 * strip it from the page. Only Cloudflare can confirm a token is genuine,
 * and only this secret key can ask.
 *
 * Deliberate design choice — FAIL OPEN, not closed:
 * if Turnstile isn't configured, the shopper's browser couldn't load the
 * script (ad blocker, poor connection), or Cloudflare itself is down, we
 * let the order through and rely on the other spam rules. For a small
 * cash-on-delivery business, turning away a paying customer costs far more
 * than occasionally letting a bot reach the "Rejected" review sheet.
 */
function verifyTurnstile(token) {
  if (!TURNSTILE_SECRET_KEY) return { ok: true, reason: "not_configured" };
  if (token === "unavailable") return { ok: true, reason: "widget_unavailable" };
  if (!token) return { ok: false, reason: "missing_token" };

  try {
    const response = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "post",
      muteHttpExceptions: true,
      payload: { secret: TURNSTILE_SECRET_KEY, response: token },
    });
    const result = JSON.parse(response.getContentText());
    if (result.success) return { ok: true, reason: "" };
    return { ok: false, reason: (result["error-codes"] || []).join(",") || "failed" };
  } catch (err) {
    // Cloudflare unreachable — don't punish the customer for our outage.
    return { ok: true, reason: "verify_error" };
  }
}

/** Rejected submissions go to their own sheet so you can review false positives. */
function recordRejected(data, reason) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Rejected");
  if (!sheet) {
    sheet = ss.insertSheet("Rejected");
    sheet.appendRow(["Time", "Reason", "Name", "Phone", "Total", "Raw"]);
    sheet.setFrozenRows(1);
  }
  const c = data.customer || {};
  sheet.appendRow([new Date(), reason, c.name || "", "'" + (c.phone || ""), data.total || "", JSON.stringify(data)]);
}

function appendOrderRow(data, itemsText) {
  const sheet = getOrCreateOrdersSheet();
  const a = data.attribution || {};
  sheet.appendRow([
    data.id,
    new Date(data.createdAt),
    data.customer.name,
    "'" + data.customer.phone, // apostrophe stops Sheets eating the leading zero
    data.customer.address,
    data.deliveryZone === "outside_dhaka" ? "ঢাকার বাইরে" : "ঢাকার ভিতরে",
    itemsText,
    data.subtotal,
    data.deliveryFee,
    data.total,
    data.paymentMethod,
    data.channel,
    data.source || "",
    // Next-order reward code. Derived from the Order ID, so when a returning
    // customer reads a code over the phone you can verify it by finding that
    // order here — no separate coupon list to maintain.
    data.rewardCode || "",
    a.channel || "",
    a.source || "",
    a.medium || "",
    a.campaign || "",
    a.content || "",
    // Leading apostrophe: click ids are long digit-heavy strings that Sheets
    // would otherwise mangle into scientific notation.
    a.clickId ? "'" + a.clickId : "",
    a.firstChannel ? a.firstChannel + (a.firstCampaign ? " / " + a.firstCampaign : "") : "",
    a.landing || "",
    a.referrer || "",
    "নতুন", // Status — update manually: নতুন / কনফার্মড / ডেলিভারড / বাতিল
  ]);
}

function getOrCreateOrdersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ORDERS_SHEET);
  if (!sheet) sheet = ss.insertSheet(ORDERS_SHEET);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Order ID", "Time", "Name", "Phone", "Address", "Zone", "Items",
      "Subtotal", "Delivery Fee", "Total", "Payment", "Channel", "Source",
      "Reward Code",
      // Campaign attribution. Ads Manager reports orders PLACED; this sheet
      // knows which ones were actually delivered and paid for. Pivot on
      // "Ad Channel" / "Campaign" against Status to get true cost per
      // delivered order — the only number that should move your budget.
      "Ad Channel", "UTM Source", "UTM Medium", "Campaign", "Ad Content",
      "Click ID", "First Touch", "Landing", "Referrer",
      "Status",
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 24).setFontWeight("bold");
  }
  return sheet;
}

// ═══ NOTIFICATIONS ══════════════════════════════════════════════════

function notifyTelegram(data, itemsText) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const text = [
    "🛒 *নতুন অর্ডার!*", "",
    "অর্ডার: `" + data.id + "`",
    "নাম: " + data.customer.name,
    "ফোন: " + data.customer.phone,
    "ঠিকানা: " + data.customer.address, "",
    "পণ্য: " + itemsText,
    "সাবটোটাল: ৳" + data.subtotal,
    "এলাকা: " + (data.deliveryZone === "outside_dhaka" ? "ঢাকার বাইরে" : "ঢাকার ভিতরে"),
    "ডেলিভারি: " + (data.deliveryFee > 0 ? "৳" + data.deliveryFee : "ফ্রি"),
    "*সর্বমোট: ৳" + data.total + "*", "",
    "চ্যানেল: " + data.channel + (data.source ? " (" + data.source + ")" : ""),
  ].join("\n");

  UrlFetchApp.fetch("https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{
          text: "📞 কাস্টমারকে WhatsApp করুন",
          url: "https://wa.me/88" + data.customer.phone + "?text=" + encodeURIComponent(
            "আসসালামু আলাইকুম " + data.customer.name + ", Orree থেকে বলছি। আপনার অর্ডার (" +
            data.id + ") আমরা পেয়েছি — কনফার্ম করতে চাই।"
          ),
        }]],
      },
    }),
  });
}

function notifyEmail(data, itemsText) {
  if (!ADMIN_EMAIL) return;
  MailApp.sendEmail(
    ADMIN_EMAIL,
    "নতুন অর্ডার: " + data.id,
    data.customer.name + " — " + data.customer.phone + "\n" + data.customer.address +
      "\n\n" + itemsText + "\n\nসর্বমোট: ৳" + data.total + " (" + data.channel + ")"
  );
}

// ═══ HELPERS ════════════════════════════════════════════════════════

function logError(err, e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Errors");
  if (!sheet) {
    sheet = ss.insertSheet("Errors");
    sheet.appendRow(["Time", "Error", "Raw payload"]);
  }
  sheet.appendRow([new Date(), String(err), e && e.postData ? e.postData.contents : ""]);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
