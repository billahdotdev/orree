# COD conversion & tracking overhaul

Everything below is already applied in this repo. Kept as a record of what
changed and why, so the next person to touch the funnel doesn't undo it.

---

## Tracking defects that were losing real money

**`InitiateCheckout` never fired on campaign landing pages.**
`openOrderForm()` read `items` from the React render closure, but
`ProductLandingPage.handleOrderClick` calls `clearCart() → addItem() →
openOrderForm()` in a single tick. On a fresh ad visit the cart is `[]`, the
`items.length > 0` guard fails, and the event is dropped — on **100% of first
clicks, on every campaign page**. The mid-funnel signal Meta leans on hardest
while Purchase volume is still thin simply did not exist.
*Fix:* `itemsRef` mirror in `CartContext` that is correct synchronously.

**`Purchase` fired on orders that failed to save.**
`trackOrderPlaced(order)` sat above the `if (saved)` branch, so every
timed-out webhook write still reported a conversion. Inflated ROAS, broke
reconciliation against the sheet, and trained the algorithm on people who
never ordered.
*Fix:* moved inside the success branch in `OrderForm.jsx`.

**Every PageView counted twice.**
The Pixel snippet fires on load; `usePageViewTracking` fired again on mount.
Landing Page Views doubled in Ads Manager, so every conversion rate dividing
by them read at half its true value.
*Fix:* `tracker.js` skips its first route-change call.

**Event Match Quality capped around 2/10.**
CAPI sent only IP and User-Agent — no `_fbp`, no `_fbc`, no hashed PII, despite
COD handing you a verified phone number on every order.
*Fix:* phone, first/last name, city and country SHA-256 hashed **in the
browser**; both cookies forwarded; `fbclid` captured into `_fbc` before the
Pixel loads, so the ~25-35% of BD mobile sessions that block `fbevents.js`
remain attributable. Expect 7+/10 within 48 hours of traffic.

**GA4 ecommerce used the wrong item schema** (`id`/`name` instead of
`item_id`/`item_name`), so revenue reports had no products attached.

**`Purchase` is now idempotent** — `event_id` is the order ID, so a double-tap,
a refresh, or a retry after a cell handover all collapse to one conversion.

**Added:** scroll depth (25/50/75/90), CTA click attribution, gallery and video
events, `Contact` on WhatsApp/Messenger/call, `contents` + `content_type` on
every Meta event for catalogue matching and dynamic retargeting.

---

## Trust and friction

**Delivery zones replaced the flat nationwide fee.** Courier reality outside
Dhaka is ৳120-150. Quoting ৳80 and letting the delivery man ask for more is the
number-one cause of refusal-at-the-door: the customer feels tricked, refuses
the parcel, and you pay return freight on goods you can no longer sell. Two-tap
zone selector now quotes the real price *before* they commit, and the zone is
logged to the sheet as its own column for your ops team.

**Risk reversal moved above the fields.** A skeptical Meta visitor has one live
question — *what if this is rubbish?* — and every input read before that gets
answered is an abandonment opportunity.

**Free-delivery threshold raised ৳1000 → ৳1500.** At ৳1000 against a ৳130
outside-Dhaka fee you were paying to ship. The higher bar also lifts average
order value, because "৳420 more for free delivery" outperforms any discount.

**Also:** 28px quantity buttons raised to 36px (below the WCAG 2.5.8 minimum and
genuinely hard to thumb), errors now clear the moment a field becomes valid
instead of only on resubmit, `inputMode="tel"` for the proper keypad,
`enterKeyHint` on every field, full `aria-invalid`/`aria-describedby` wiring,
and quantity surfaced in the sticky bar (the stepper is up in the hero, so a
user who scrolled to the reviews had no idea what they were committing to).

---

## Stability

**`FreeShippingBar` would have white-screened the open checkout sheet.** It
destructured `flatFee` and called `.toLocaleString()` unguarded — a certain
TypeError under the new shipping shape, in the worst possible place in the
funnel. Now reads defensively.

**12s fetch timeout plus one silent retry** on the order webhook. A hung
request previously left the submit button spinning forever with no escape.

**CAPI relay** retries once on 5xx, re-hashes any raw PII that slips through so
a bad client build can never leak a plaintext phone to Meta, and supports
`META_TEST_EVENT_CODE`.

**`script.remove()`** instead of `document.head.removeChild()` for the
injected JSON-LD — the latter throws on an already-detached node under
StrictMode.

---

## Performance

**Fonts: 3 families × 10 weights → 2 families × 4 weights, non-blocking.**
Bengali glyph coverage runs roughly 8× a Latin subset, so the old payload was
~400-600KB sitting directly in front of first paint — two to three seconds of
blank screen on a Dhaka 4G handset, paid for with ad spend. `Noto Serif
Bengali` was loaded in full to style a single pull-quote; `font-quote` now
falls back through Anek Bangla and the system Bengali serif.

**Vendor chunk splitting.** React/Router (162KB) and icons (20KB) are now
separate from app code (89KB), so a copy tweak in `/admin` no longer
invalidates React for every returning visitor.

**Next lever if LCP is still above 2.5s:** self-host both families subset to
Bengali + Latin with `glyphhanger`, and drop the two Google font origins from
the CSP.

---

## Security & infra

- **Content-Security-Policy** is now active in `public/_headers`, with every
  allow-listed origin documented inline. Note that the Apps Script webhook
  302s from `script.google.com` to `script.googleusercontent.com`, so **both**
  must stay listed or orders silently fail.
- `Strict-Transport-Security`, `no-store` on `/api/*`.
- `facebook-domain-verification` meta, injected from env and **stripped
  entirely when unset** rather than shipping a literal `%VITE_...%` token.
- `wrangler.toml` for Pages CLI deploys.

---

## Round 2 — performance pass

**Fonts are now self-hosted.** Previously two DNS+TLS handshakes to
`fonts.googleapis.com` and `fonts.gstatic.com`, then two *serial* round-trips
(the CSS, then the font files it names) before a single branded character
could paint. On Dhaka 4G that was the largest single item on the critical
path. Now: same origin, 4 weights (audited — display uses 600/800, body uses
400/600; every other weight was unused or browser-synthesised), split by
`unicode-range` so a Bengali-only page never fetches the Latin files, cached
`immutable` for a year, and `font-src 'self'` in the CSP means no third-party
font origin is reachable at all.

**The font swap no longer shifts layout.** `font-display: swap` paints text
instantly in a fallback, then swaps — which reflows every paragraph unless the
fallback occupies the same vertical box. The `ascent-override` /
`descent-override` values in `src/index.css` are not guesses; they were read
out of the woff2 files with fontTools:

| family | unitsPerEm | hhea ascent | hhea descent | overrides |
|---|---|---|---|---|
| Anek Bangla | 2000 | 2500 | −1232 | 125% / 61.6% |
| Hind Siliguri | 1000 | 1116 | −501 | 111.6% / 50.1% |

**Only the two above-the-fold faces are preloaded** — Anek 800 (the H1) and
Hind 400 (body). The other two load when reached. Note the `crossorigin`
attribute on those preloads: it is mandatory even same-origin, and omitting it
makes the browser download each file twice.

**Killed a GPU-expensive blur.** The hero's amber glow was a 256px box with
`blur-[110px]`. A blur radius that large forces a full-surface Gaussian pass
every frame the hero is composited — measurable jank on the Adreno GPUs in
sub-20,000 BDT Androids, which is most of your traffic. A `radial-gradient`
renders identically and costs nothing.

**Removed `@babel/parser`** from `dependencies`, where it had no business being.

### Measured first load — `/candy`, brotli, as Cloudflare serves it

| | |
|---|---|
| render-blocking (HTML + CSS) | **10.3 KB** |
| JS (parse + execute) | 75.5 KB transferred / 286 KB raw |
| preloaded fonts | 119 KB |
| hero product image (webp) | 7.9 KB |
| **total** | **≈ 213 KB** |

### Expected Lighthouse

I could not run Lighthouse in this environment, so treat this as a reasoned
estimate from the measured numbers rather than a result:

- **Desktop: 97-100.**
- **Mobile, tracking disabled: 92-98.** Render-blocking is only 10 KB, LCP text
  paints in a metric-matched fallback immediately, images are webp with
  explicit dimensions and `fetchpriority`.
- **Mobile, with Meta Pixel + GA4 live: roughly 85-93.** Lighthouse charges you
  for third-party script main-thread time, and `fbevents.js` plus `gtag.js`
  together are typically 5-10 points. This is not a defect to fix — it is the
  price of attribution, and a 90 with working CAPI earns more than a 99 with
  blind ad spend.

The remaining lever, if you want it: drop Hind Siliguri and point `body` at
Anek Bangla 400 in `tailwind.config.js`. That removes ~142 KB of Bengali
glyphs. It is a typographic decision, not a technical one, so I left it to you.

---

## Round 3 — brand marks, free delivery, high-intent CTAs

**Real WhatsApp and Messenger marks** (`src/components/BrandIcons.jsx`).
Both buttons previously wore the same generic lucide speech bubble, and
WhatsApp's was painted in the site's amber — two near-identical circles that
told the visitor nothing about which app would open. Worse, amber is this
site's *buy* colour, so a chat button was competing with the order CTA for the
most valuable pixel on a phone screen. Now each wears its own brand colour
(`#25D366` / `#0084FF`) and mark, and amber belongs to the thing that makes
money. Inline SVG, so no extra request. Also applied to the order-confirmation
chat buttons and the footer contact row.

**Chat glyph removed from the order CTAs.** The button posts a real order to
the Google Sheet backend; a speech bubble promised "this opens a chat", a
different and lower-commitment action. Icon/action mismatch costs trust at
precisely the wrong moment.

**Delivery is free everywhere** — `shipping: { insideDhaka: 0, outsideDhaka: 0,
flatFee: 0, freeThreshold: 0 }`. Three knock-on changes that a data-only edit
would have missed:

1. **`FreeShippingBar` is now dual-mode.** The "spend ৳X more to unlock free
   delivery" progress bar becomes actively misleading at ৳0 — it implies a
   charge that will never be applied and asks the customer to add items to
   escape a fee that doesn't exist. That reads as manipulation the second they
   reach the summary and see ৳0. It now renders a flat free-delivery badge
   instead, and switches back automatically if you reintroduce charges.
2. **FAQ answer corrected.** It stated "ডেলিভারি চার্জ একবারই প্রযোজ্য হবে" —
   false under free shipping.
3. **Free delivery promoted to a headline benefit** in the checkout risk-reversal
   strip and the landing-page trust row, reading from the same `shipping`
   object so the claim can never drift from the totals.

The zone selector is deliberately kept at ৳0. It still tells your ops team
which courier rate to expect, sets the right delivery-time expectation, and
means the machinery is already in place when you charge again.

**Cross-sell now shows the product photo.** Judged worth it: a name alone asks
the customer to recall what "চুই ঝাল বাইটস" looks like from a section they've
already scrolled past. Made safe rather than merely added — fixed 56×56 box
with explicit `width`/`height` so the slot is reserved before the bytes arrive
(CLS inside an open checkout is unforgivable; a thumb mid-tap on "যোগ করুন"
must not have the button move), `loading="lazy"`, and a branded initial-letter
placeholder if the image is missing or fails. Photos are ~8KB webp.

**Order CTA in the image lightbox.** A customer who has pinch-zoomed into the
product is at the highest-intent moment on the page — inspecting, not browsing.
Previously the only exit was to close, scroll back and re-find the button, and
every step sheds people. The CTA sits in the bottom rail, *outside* the pan and
pinch surface, so it can never fire from a stray drag and never covers the
image being studied. It stays visible while zoomed, because zoomed is the
high-intent state. Wired on both the landing page (fires `lightbox_order` for
CTA attribution) and the main-site product cards; the prop is optional, so any
other lightbox usage is unaffected.

**Also:** the landing trust row had two identical `ShieldCheck` icons side by
side — the eye reads a repeated icon as one item and skips the second. Now
three distinct icons, and the row wraps instead of squeezing on a 360px screen.

---

## Round 4 — catalogue rebuilt from the sticker sheet, next-order reward

### Catalogue

The printed stickers and the live site disagreed on almost everything:

| sticker sheet | site had |
|---|---|
| চুইঝাল মিছরি মসলা, ৫০০ গ্রাম | চুই ঝাল **চায়ের** মসলা, ১০০ গ্রাম, ৳৩৫০ |
| কম্বো: মিছরি মসলা ২৫০গ + ক্যান্ডি ২৫০গ | — (no combo SKU) |
| Date Seed Coffee, ২০০ গ্রাম, ক্যাফেইন-মুক্ত | — (missing entirely) |
| — | চুই ঝাল বাইটস (no sticker exists) |

Catalogue now matches the stickers. Notes on the judgement calls:

- **The moshla `id` was deliberately left as `chui-jhal-cha-moshla`** even
  though the name changed. Changing it would break the `/moshla` landing page,
  every ad link pointing at it, and the join between new orders and the rows
  already sitting in your sheet.
- **বাইটস was kept, not deleted.** No sticker exists for it, but "no sticker"
  is not the same as "discontinued". If it really is retired, set
  `inStock: false` or delete the block.
- **New landing pages** `/combo` and `/coffee` are seeded and live.
- **Photos** for the combo and the coffee are `images: []`, which renders the
  branded placeholder rather than a broken image. Drop files into
  `public/products/` and add the paths.

> ⚠️ **Prices marked `★` in `siteData.js` are estimates and must be confirmed
> before you spend on ads.** The stickers carry no prices. The moshla one is
> the urgent case: it went from ১০০ গ্রাম to ৫০০ গ্রাম, so the old ৳৩৫০ is
> certainly wrong. In COD a wrong price means the delivery man asks for a
> different number at the door — the order is refused and you pay return
> freight.

**Combo pricing was corrected mid-build.** The first draft had
`compareAtPrice: 1900`, which was the 500g+500g total — but the combo is
250g+250g. Pro-rata that is ৳500 + ৳450 = ৳950, so the compare-at is ৳950 and
the combo sells at ৳850. An inflated strike-through price is a fake discount:
customers do the arithmetic, and Bangladesh's consumer-rights law takes a dim
view of it. Never let `compareAtPrice` exceed the true à-la-carte sum.

### Next-order reward

The printed letter promises **১০% অতিরিক্ত পণ্য ফ্রি** — extra *product*, not
১০% off. The site now mirrors that wording exactly, from one config object
(`repeatOffer` in `siteData.js`). If the screen said "১০% ছাড়" and the letter
said "১০% অতিরিক্ত পণ্য", the customer argues with your team on the next call
and someone has to eat the difference. Change both together.

Commercially the letter's version is also the better one: a 10% discount comes
straight off margin, while 10% extra product costs only production and grows
the next basket.

**The code is derived from the order ID** (`ORR-482913-K7M2P` →
`ORREE10-K7M2P`), not random. Your team can verify any code a customer reads
out by finding that order in the sheet — no coupon database, nothing to keep in
sync. It is not unguessable by design; the offer costs 10% of product cost on
an order you would not otherwise have had, so fraud resistance isn't the point.

**Placed below the order summary, not above.** The first question after
ordering is "did it work, and what did it cost me?" — answer that first. An
upsell above the confirmation reads as a shop more interested in the next sale
than this one.

The code is logged to the sheet as its own column, and copying it fires a
`reward_code_copied` custom event — the strongest repeat-intent signal you get,
and a good custom audience to build on.

---

## Round 5 — images on every order line, dismissible suggestions

### `ProductThumb` — one component, three placements

Cart items previously carried **no image at all** — `addItem` stored only id,
title, price, currency, weight and qty. So this wasn't a styling change; the
data had to be added. `addItem` now snapshots the primary image at add-time,
and `OrderForm` falls back to a catalogue lookup by id for carts persisted by
an older build, so returning customers don't see letter-placeholders after the
upgrade.

Now used in three places:

| where | size | tappable |
|---|---|---|
| cart lines being ordered | 52px | yes |
| cross-sell suggestion | 52px | yes |
| confirmed-order receipt | 34px | no |

The receipt thumbs are smaller and deliberately inert — it's a receipt, not a
shopping view. They confirm "yes, that's what I bought" without pushing the
reward code and the chat buttons below the fold on a small phone.

### Tap-to-peek

Tapping a thumbnail enlarges it over the sheet and it fades out by itself after
2.4s. Also dismisses on any tap, Escape, or scroll.

**It deliberately does not open the real `ImageLightbox`.** The order sheet is
already a modal; stacking the lightbox on top would put two dialogs in
contention over the focus trap, the Escape handler and `body.overflow` — and
worse, it would pull the customer *out* of checkout into a browsing gesture at
the exact moment they were about to buy. This is a glance, not a detour: it
never steals focus, never touches scroll lock, and leaves on its own.

The Escape handler calls `stopPropagation` so closing a peek can never close
the whole checkout underneath it.

### Cross-sell dismiss — yes, worth adding

Without it the suggestion is a fixed obstacle between the cart and the form:
the customer can't make it go away, so on a small screen it is pure friction
during the one flow you least want to disturb. A shop that takes "no thanks"
for an answer feels like a shop rather than a funnel.

Dismissing **advances to the next eligible product** rather than emptying the
slot, so "not that one" doesn't cost you the chance to offer something they do
want. When the list runs out the slot disappears — no nagging. State is
per-session; persisting refusals would mean a product silently never being
offered again months later, which is a lot of hidden behaviour for very little
gain. The X is visually quieter than "যোগ করুন" so it never competes with the
action that earns money. Dismissals fire `cross_sell_dismissed` — if one
product gets waved away far more than the others, the problem is usually the
offer or the price, not the placement.

### Two bugs found while verifying the build output

1. **Backdrop animation.** The peek backdrop first used `fade-up`, which also
   translates 24px — on a full-bleed fixed overlay that leaves a visible gap
   along the bottom edge for the length of the animation. Switched to
   `.sheet-backdrop`, which is a pure opacity fade.
2. **A junk CSS rule was shipping in every build.** Tailwind's content scanner
   read the string `"[tracker:capi]"` in a `console.debug` call as an arbitrary
   class name and emitted `.\[tracker\:capi\]{tracker:capi}` — an invalid
   declaration — into the production stylesheet. The log prefix was changed;
   the rule is gone.

---

## Round 6 — one landing page per product, one URL per landing page

First, a correction: `ProductOneLanding.jsx` and `ProductTwoLanding.jsx` were
not merged by me. They were in the original upload as 400-byte stubs that did
nothing but `export { default } from "./ProductLandingPage.jsx"` — and nothing
imported them. They were dead files. Deleted.

Separate *files* were never what Meta needs; separate **URLs** are. Five copies
of a 400-line component means every fix has to be made five times and one of
them will be forgotten. The template stays shared; the URLs are now genuinely
separate. Three real problems were found and fixed.

### 1. Two of four products had no clean URL

`/candy` and `/moshla` were hand-written `<Route>` lines. `/combo` and
`/coffee` were only reachable at `/lp/combo` and `/lp/coffee` — nobody had
remembered to add them.

Routes are now generated from the campaigns array. Add a campaign in `/admin`
and its URL exists immediately: `/candy`, `/moshla`, `/combo`, `/coffee`. A
hand-maintained route list drifts the moment someone adds a product; this
cannot.

### 2. Every product had two URLs, splitting your pixel data

`/candy` and `/lp/candy` both rendered the same page. Meta therefore saw two
`event_source_url` values for one funnel, any URL-based custom audience covered
only part of the traffic, and Google saw duplicate content.

`/lp/<slug>` now **redirects** to `/<slug>` instead of rendering a second copy.
Old ad links and printed QR codes keep working; there is exactly one canonical
URL per product.

### 3. Every landing page told crawlers it was the homepage

`index.html` carries `<link rel="canonical" href="https://orree.bd/">`. An SPA
never reloads that file, so `/candy` was declaring the homepage as its real
address — the exact opposite of per-product landing pages. `usePageMeta` now
sets canonical and `og:url` per route, from a single `canonicalPath` emitted by
`resolveCampaign`, so a slug change can never leave the tags disagreeing.

### Prerendering — the one that matters most for paid traffic

**Meta's link-preview crawler does not execute JavaScript.** In a plain SPA
build there is one HTML file, so every landing URL served the homepage's title,
description and og:image. An ad pointing at `/candy` previewed the generic
homepage card instead of the candy photo.

`scripts/prerender.mjs` (wired into `npm run build`) now writes a real static
document per landing URL:

```
dist/candy/index.html   → <title>চুই ঝাল ক্যান্ডি | Orree</title>
                          canonical + og:url  https://orree.bd/candy
                          og:image            /products/chui-jhal-candy.webp
dist/moshla/index.html
dist/combo/index.html
dist/coffee/index.html  → falls back to /og-image.jpg (no photo yet)
```

Cloudflare Pages serves static files before the `_redirects` SPA fallback, so a
crawler or a direct hit gets the right document and React then hydrates the
same route. The JS bundle is untouched — only the `<head>` differs per file,
and it is generated from the same `siteData` the app renders from, so there is
no second copy to keep in sync.

`og:image:width/height` are stripped on these pages: the homepage card is
1200×630 and the product photos are square, so declaring the wrong dimensions
would have made Meta crop them.

The same script regenerates `sitemap.xml` (which was still listing only two
URLs) and appends `Cache-Control: no-cache` rules for each shell — they
reference hashed asset filenames, so a stale copy would point at files that no
longer exist.

### Meta setup

Each ad set points at its own URL. `source` is already distinct per campaign
(`lp-candy`, `lp-moshla`, `lp-combo`, `lp-coffee`) and rides along to the sheet
and to CAPI, so ViewContent → InitiateCheckout → Purchase is attributable to
one product end to end.

Still worth knowing: `robots.txt` disallows `/lp/`, which is correct now that
those paths only redirect. And per-route **Product JSON-LD** is still injected
client-side only — Google's JS-rendering pass picks it up, but if you want rich
results reliably, that is the next thing to move into the prerenderer.

---

## Round 7 — campaign attribution, Google Ads, documentation

### The gap: zero campaign attribution

An order recorded `source: "lp-candy"` and nothing else. That names the product
page, not the ad. None of the questions that decide where budget goes could be
answered: which ad set, which creative, Meta or Google.

`src/utils/attribution.js` now captures `utm_*`, `gclid`/`gbraid`/`wbraid`,
`fbclid`, `ttclid`, `msclkid` and the referring host, and every order carries a
snapshot into the sheet as nine new columns.

**First touch and last touch, both.** Bangladeshi COD buyers rarely convert on
the first visit — see a Meta reel, leave, search the brand on Google days later,
order. Last-touch alone credits Google for demand Meta created; first-touch
alone ignores the ad that closed. 30-day window, matching Meta's default click
attribution; beyond that, stale UTMs quietly credit campaigns that ended a month
ago.

A plain refresh or internal navigation carries no campaign parameters and
therefore **cannot** overwrite last-touch. Without that guard every reload would
relabel a paid visit as "direct" and you would lose the attribution you just
paid for.

The channel classifier is deliberately conservative — click ID or paid
`utm_medium` is paid, a known search host with no click ID is organic search,
any other host is referral, no referrer is direct. Guessing harder than that
produces confident nonsense. All 8 classification cases verified.

**What this buys you:** filter the sheet on Status = delivered, pivot by
Campaign. That is **cost per delivered order** — the number Ads Manager cannot
give you, because it counts orders placed, not orders that survived the
doorstep. In COD that gap is routinely 20-40%, and budget moved on the wrong
one funds whichever campaign brings the most refusals.

Click IDs are written with a leading apostrophe so Sheets doesn't mangle long
digit-heavy strings into scientific notation.

### Google Ads was completely untracked

GA4's `purchase` event does **not** feed Google Ads bidding. Without an `AW-`
config and a conversion label, Smart Bidding and Performance Max optimise
toward clicks instead of orders. Added: the Ads config on the same gtag
instance (with `allow_enhanced_conversions`, which reuses the hashed phone we
already collect), and a conversion event on purchase keyed on the order id so
Ads deduplicates retries the way Meta does.

Both new env vars are documented in `.env.example`, including exactly where to
find them in the Ads UI.

### Documentation

The original `HANDOFF.md` and `README.md` described products, prices, delivery
charges and routes that no longer exist — actively misleading. Moved to
`docs/archive/` with a note, and replaced:

- **`HANDOFF.md`** — architecture, tracking, order flow, performance, known
  limitations, pre-launch checklist, open items, and a "where do I change X"
  table. Written for someone opening this repo cold.
- **`README.md`** — short entry point that routes to the right doc.
- **`docs/ADDING-PRODUCTS.md`** (বাংলা) — the two objects you write to add a
  product and its landing page, what happens automatically afterwards, image
  specs with `cwebp` commands, a pre-launch checklist, and the four mistakes
  people actually make.
- **`docs/CAMPAIGN-SETUP.md`** (বাংলা) — why paid traffic never goes to `/`, the
  exact UTM strings to paste into Meta and Google Ads, AEM event priority,
  a starting campaign structure, the three retargeting audiences this site's
  events make possible, and which numbers to actually watch.
