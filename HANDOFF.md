# Orree — Handoff

**Cash-on-delivery e-commerce site for Bangladesh, built for Meta and Google Ads traffic.**
React 18 + Vite + Tailwind SPA on Cloudflare Pages. Google Sheets as the order backend.

> This replaces the original `HANDOFF.md` and `README.md` (now in
> `docs/archive/`), both of which predate a substantial rebuild and describe
> products, prices, routes and delivery rules that no longer exist.
>
> Full history of what changed and why: **`CHANGELOG-CRO-PATCH.md`**.

---

## 1. Read this first

Three things are easy to break and expensive when broken:

1. **`Purchase` fires only after the order is confirmed saved** — not on
   submit. If `trackOrderPlaced()` ever moves out of the `if (saved)` branch in
   `OrderForm.jsx`, every failed write reports a fake conversion, ROAS becomes
   fiction, and Meta learns to chase people who never ordered. This was a real
   bug that got fixed. Don't reintroduce it.

2. **One product = one URL.** `/lp/<slug>` redirects to `/<slug>`. Two URLs for
   one product split the pixel data and halve every URL-based audience.

3. **Prices, delivery and copy live in `src/data/siteData.js`.** Components
   never hardcode them. A number appearing in two places is a bug waiting.

---

## 2. Running it

```bash
npm ci
cp .env.example .env       # empty vars simply disable that feature
npm run dev                # http://localhost:5173
```

| script | does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | vite build **+ prerender landing pages + sitemap** |
| `npm run lint` | eslint |
| `npm run fonts:sync` | re-copy fonts from `@fontsource` into `public/fonts/` |
| `npm run prerender` | prerender only (needs existing `dist/`) |

**Deploy:** push to the connected repo. Cloudflare Pages builds with
`npm run build`, output directory `dist`.

---

## 3. Environment variables

Cloudflare Pages → Settings → Variables and Secrets.

### Build-time (public — compiled into the browser bundle)

| var | purpose |
|---|---|
| `VITE_SHEETS_WEBHOOK_URL` | Apps Script Web App URL — where orders go |
| `VITE_META_PIXEL_ID` | Meta Pixel / Dataset ID |
| `VITE_GA4_ID` | `G-XXXXXXXXXX` |
| `VITE_GOOGLE_ADS_ID` | `AW-1234567890` |
| `VITE_GOOGLE_ADS_PURCHASE_LABEL` | conversion label from the Ads tag snippet |
| `VITE_FB_DOMAIN_VERIFICATION` | required for iOS Aggregated Event Measurement |
| `VITE_TURNSTILE_SITE_KEY` | optional spam protection |

### Secrets (mark **Encrypted**, never prefix with `VITE_`)

| var | purpose |
|---|---|
| `META_PIXEL_ID` | same value as the VITE one |
| `META_CAPI_TOKEN` | Conversions API token |
| `META_TEST_EVENT_CODE` | `TEST12345` — **remove before scaling spend** |

> A `VITE_` variable is readable by anyone who opens the bundle.
> `META_CAPI_TOKEN` there would let a stranger post fake conversions into your
> pixel.

Every integration degrades safely when its variable is missing: no Pixel ID
means no Pixel loads; no webhook URL means the form still works and falls back
to WhatsApp.

---

## 4. Architecture

```
Browser (React SPA on Cloudflare Pages)
│
├── Order submit ──► Apps Script Web App ──► Google Sheet
│                    (validates, appends row, emails you)
│
├── Meta Pixel (browser) ─┐
│                          ├─► deduplicated by event_id
├── /api/capi ─────────────┘   (Pages Function → Meta Conversions API)
│
├── GA4 (gtag)
└── Google Ads conversion (gtag, AW- id)
```

```
src/
├── App.jsx                    routing; landing routes GENERATED from campaigns
├── tracker.js                 ★ all analytics: GA4 + Pixel + CAPI + Ads
├── data/siteData.js           ★ all content, prices, products, campaigns
├── context/
│   ├── CartContext.jsx        cart; itemsRef mirror fixes a stale-closure bug
│   └── ToastContext.jsx
├── services/
│   ├── orderService.js        ★ order build, delivery fee, reward code, submit
│   ├── antiSpam.js            cooldown between orders
│   └── messenger.js           clipboard + m.me (Messenger can't prefill text)
├── utils/
│   ├── attribution.js         ★ UTM / gclid / fbclid, first + last touch
│   ├── campaigns.js           campaign → product resolution, canonicalPath
│   └── productImages.js       image resolution with legacy `image` fallback
├── landing-pages/
│   └── ProductLandingPage.jsx ONE shared template for every landing page
└── components/                ~30 components
functions/api/capi.js          Meta CAPI relay (Cloudflare Pages Function)
google-apps-script/Code.gs     Sheet backend — paste into Apps Script
scripts/prerender.mjs          ★ static HTML per landing URL + sitemap
docs/                          ADDING-PRODUCTS.md, CAMPAIGN-SETUP.md, archive/
```

★ = read before changing anything nearby.

**~6,700 lines of app code.** Bundle: 162 KB vendor-react + 102 KB app +
20 KB icons, plus lazy chunks (8 KB landing, 23 KB admin).

---

## 5. Routing

| route | purpose |
|---|---|
| `/` | main site — organic, brand search, repeat buyers |
| `/candy` `/moshla` `/combo` `/coffee` | landing pages — **all paid traffic** |
| `/lp/:slug` | redirects to `/:slug` (legacy links, printed QR codes) |
| `/admin` | no-code editor, `noindex` |
| `*` | 404 |

Landing routes are **generated from the `campaigns` array**. Adding a campaign
creates its URL — there is no route list to maintain.

**Never send paid traffic to `/`.** One product means one decision; a homepage
with five products is five chances to leave. Landing pages also run an
isolated, non-persisted cart, so an ad visitor never inherits a stale cart.

---

## 6. Tracking

| event | fires when |
|---|---|
| `PageView` | once on load (`index.html`), then per route change |
| `ViewContent` | landing page view, once per product per session |
| `AddToCart` | add to cart |
| `InitiateCheckout` | order sheet opens |
| `Purchase` | **only after the sheet write is confirmed** |
| `Contact` | WhatsApp / Messenger / call |

Custom: `scroll_depth` (25/50/75/90), `cta_click`, `reward_code_copied`,
`cross_sell_dismissed`, `gallery_view`, `video_play`, `faq_open`.

### Why Event Match Quality is good here

`buildUserData()` SHA-256 hashes phone, first name, last name and city **in the
browser** and sends them as Meta advanced-matching keys alongside `_fbp` and
`_fbc`. Raw personal data never leaves the device; the CAPI relay sees only
digests and re-hashes anything unhashed as a safety net.

Phone is the strongest match key available in Bangladesh and COD hands it to
you on every order. Expect **EMQ 7+/10** within 48h of traffic. Below that,
Meta's optimisation degrades noticeably.

`fbclid` is also written into a `_fbc` cookie by an inline snippet **before**
the Pixel loads, because a meaningful share of BD mobile sessions block or
delay `fbevents.js`. Without it those clicks are unattributable.

### Deduplication

`Purchase` uses the order id as `event_id` — a double-tap, refresh, or retry
after a dropped connection all collapse to one conversion.

### Attribution → Google Sheet

`utils/attribution.js` captures `utm_*`, `gclid`/`gbraid`/`wbraid`, `fbclid`,
`ttclid`, `msclkid` and the referring host, keeping **first touch and last
touch** for 30 days. Every order carries a snapshot into the sheet as nine
columns.

This gives you the number Ads Manager cannot: **cost per *delivered* order**.
Ads Manager counts orders placed; the sheet knows which survived the doorstep,
and in COD that gap is routinely 20-40%.

Exact UTM strings to paste into Meta and Google Ads: `docs/CAMPAIGN-SETUP.md`.

---

## 7. Order flow

```
tap CTA → OrderForm opens (InitiateCheckout)
        → name / phone / delivery zone / address
        → submit → orderService.submitOrder()
            ├─ builds order (id, reward code, attribution, delivery fee)
            ├─ POSTs to Apps Script (12s timeout, one retry)
            └─ returns { saved: true | false }
        → saved   → Purchase fires, success screen, reward code
        → !saved  → honest error + WhatsApp / call fallback, NO Purchase
```

**Deliberately not `mode: "no-cors"`.** An opaque response would force the UI
to claim success even when nothing was stored. Silently losing a COD order is
worse than an honest error with an escape hatch.

### Delivery

Currently **free everywhere**
(`shipping: { insideDhaka: 0, outsideDhaka: 0, flatFee: 0, freeThreshold: 0 }`).

The zone selector stays at ৳0 on purpose: it tells ops which courier rate to
expect, sets the delivery-time expectation, and keeps the machinery ready. When
you charge again, quoting the real per-zone price *before* the customer commits
is what prevents refusal-at-the-door — the largest single cause of COD losses
in Bangladesh.

`FreeShippingBar` switches modes automatically: a flat "free everywhere" badge
while all zones are ৳0, the threshold progress bar once a fee exists.

### Repeat reward

The printed letter promises **১০% অতিরিক্ত পণ্য ফ্রি** — extra *product*, not
10% off. The success screen mirrors that wording exactly from `repeatOffer` in
siteData. **Change both together** or your team ends up arguing with customers
on the phone.

The code derives from the order id (`ORR-482913-K7M2P` → `ORREE10-K7M2P`), so
any code read out over the phone is verifiable by finding that order in the
sheet. No coupon database needed.

---

## 8. Google Sheet backend

`google-apps-script/Code.gs` → paste into a Sheet's Apps Script editor, deploy
as a Web App (execute as you, access: anyone), put the URL in
`VITE_SHEETS_WEBHOOK_URL`.

24 columns: order details, delivery zone, reward code, nine attribution columns.

> Adding columns does **not** migrate an existing sheet's header row. Start a
> fresh sheet or fix the header manually, or data lands under wrong labels.

---

## 9. Performance

- **Fonts self-hosted**, 2 families × 4 weights (audited: display 600/800, body
  400/600). Split by `unicode-range` so a Bengali-only page never fetches the
  Latin files. Cached immutable for a year.
- **Fallback metrics matched** (`ascent-override` etc. read out of the woff2
  files with fontTools) so the `font-display: swap` moment doesn't reflow text.
- **Vendor chunks split** — an admin copy tweak doesn't invalidate React for
  returning visitors.
- **Images** webp, explicit `width`/`height`, `fetchpriority="high"` on LCP.
- Measured first load on `/candy` (brotli): ~10 KB render-blocking, ~213 KB total.

Expected Lighthouse mobile with Pixel + GA4 live: **85-93**. Third-party ad
scripts cost 5-10 points — that is the price of attribution, not a defect.

Next lever: drop Hind Siliguri, use Anek Bangla 400 for body text (~142 KB).
A typographic decision, not a technical one.

---

## 10. Known limitations

| limitation | impact | fix if needed |
|---|---|---|
| Product JSON-LD is client-side only | Google's JS pass sees it; rich results less reliable | move into `scripts/prerender.mjs` |
| `/admin` edits are browser-local | not shared, not in git, **not prerendered** | keep ad products in `siteData.js` |
| `'unsafe-inline'` in script-src | needed by the GA4/Pixel bootstrap | externalise the snippet with a hash |
| No automated tests | regressions rely on lint + build + manual QA | Vitest on `orderService`, `attribution`, `campaigns` first |
| Reward codes guessable | by design — costs 10% of product cost on an order you wouldn't have had | server-side validation if abuse appears |

---

## 11. Pre-launch checklist

**Do not spend money until these pass.**

```
[ ] Test order end-to-end → Purchase appears ONCE in Events Manager Test
    Events, flagged Browser + Server with the dedup badge
[ ] Event Match Quality >= 7/10 after ~48h of traffic
[ ] Block the webhook in DevTools → submit → honest error, NO Purchase fires
[ ] Fresh incognito → /candy → tap CTA → InitiateCheckout fires
[ ] Pixel Helper: exactly one PageView on load, one per route change
[ ] Open a UTM-tagged URL → order → Campaign column filled in the sheet
[ ] Meta domain verified + 8 AEM events prioritised
[ ] Google Ads auto-tagging on; conversion visible in Tag Assistant
[ ] ★ prices in siteData confirmed (see §12)
[ ] META_TEST_EVENT_CODE removed
```

---

## 12. Open items

1. **★ Prices are estimates.** Marked with ★ in `siteData.js`. The sticker sheet
   carries no prices, so মিছরি মসলা, কম্বো and কফি were inferred. The moshla one
   is urgent — it went from 100g to 500g, so the old ৳350 is certainly wrong.
   **A wrong price in COD means the delivery man asks for a different number at
   the door: the parcel is refused and you pay return freight.**
2. **Missing photos.** `/combo` and `/coffee` have `images: []` and render a
   branded placeholder; their OG previews fall back to the generic site card.
3. **চুই ঝাল বাইটস** has no sticker. Kept live — "no sticker" isn't
   "discontinued". If retired, set `inStock: false`.
4. **`brand.website`** is `https://orree.bd`. If the real domain differs, change
   it — the prerenderer, sitemap and canonical tags all read from it.

---

## 13. Where to look

| I want to… | file |
|---|---|
| change a price, product, or any copy | `src/data/siteData.js` |
| add a product / landing page | `docs/ADDING-PRODUCTS.md` |
| set up ads and UTMs | `docs/CAMPAIGN-SETUP.md` |
| change what's tracked | `src/tracker.js` |
| change the checkout | `src/components/OrderForm.jsx` |
| change order/delivery logic | `src/services/orderService.js` |
| change campaign attribution | `src/utils/attribution.js` |
| change the landing page layout | `src/landing-pages/ProductLandingPage.jsx` |
| change sheet columns | `google-apps-script/Code.gs` |
| change OG tags / prerendering | `scripts/prerender.mjs` |
| understand *why* something is that way | `CHANGELOG-CRO-PATCH.md` |
