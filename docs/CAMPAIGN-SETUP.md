# Meta ও Google Ads — ক্যাম্পেইন স্ট্রাকচার

এই সাইটের ট্র্যাকিং যেভাবে বানানো, তার সাথে মিলিয়ে বিজ্ঞাপন চালানোর গাইড।

---

## ১. মূল কাঠামো — কোন পেজে কোন ট্রাফিক

| পেজ | URL | কার জন্য | ট্রাফিকের ধরন |
|---|---|---|---|
| ল্যান্ডিং পেজ | `/candy`, `/moshla`, `/combo`, `/coffee` | **সব পেইড বিজ্ঞাপন** | ঠান্ডা + রিটার্গেটিং |
| মূল সাইট | `/` | ব্র্যান্ড সার্চ, অর্গানিক, রিপিট কাস্টমার | উষ্ণ |

**পেইড ট্রাফিক কখনো `/` তে পাঠাবে না।** কারণ:

- ল্যান্ডিং পেজে **একটাই প্রোডাক্ট, একটাই সিদ্ধান্ত** — হোমপেজে ৫টা প্রোডাক্ট মানে ৫টা
  সিদ্ধান্ত, আর প্রতিটা সিদ্ধান্ত মানে বেরিয়ে যাওয়ার একটা সুযোগ।
- ল্যান্ডিং পেজের কার্ট আলাদা (`persist={false}`) — বিজ্ঞাপনের ভিজিটর হোমপেজের
  পুরনো কার্ট নিয়ে বিভ্রান্ত হয় না।
- ViewContent একটাই প্রোডাক্টের জন্য ফায়ার করে → Meta পরিষ্কার সংকেত পায়।
- প্রতিটা পেজের নিজস্ব `source` আছে (`lp-candy` ইত্যাদি) → শিটে আলাদা করা যায়।

---

## ২. UTM নিয়ম — এটাই সবচেয়ে জরুরি অংশ

সাইট এখন প্রতিটা অর্ডারের সাথে **কোন বিজ্ঞাপন থেকে এসেছে** সেটা Google Sheet-এ
লিখে রাখে। কিন্তু সেটা কাজ করবে **শুধু যদি তুমি URL-এ UTM বসাও**।

### Meta-তে

Ads Manager → Ad level → **URL parameters** ঘরে হুবহু এটা বসাও:

```
utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```

Website URL: `https://orree.bd/candy`

`{{...}}` গুলো Meta নিজে পূরণ করে দেয় — হাতে কিছু লিখতে হবে না।

### Google Ads-এ

Google **auto-tagging** (`gclid`) ব্যবহার করে, তাই আলাদা UTM বাধ্যতামূলক নয়।
তবু রিপোর্ট মেলানোর জন্য Campaign settings → **Tracking template**:

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}
```

> **Auto-tagging অবশ্যই চালু রাখো** (Account Settings → Auto-tagging)। `gclid`
> ছাড়া Enhanced Conversions কাজ করে না।

### এর ফলে শিটে যা পাবে

| কলাম | উদাহরণ |
|---|---|
| Ad Channel | `meta_ads` / `google_ads` / `organic_search` / `direct` |
| UTM Source | `meta` |
| Campaign | `Candy-Cold-Traffic-July` |
| Ad Content | `Reel-Grandmother-15s` |
| Click ID | `IwAR2x...` |
| First Touch | `meta_ads / Candy-Cold-Traffic` |
| Landing | `/candy` |

**এখান থেকে যে হিসাবটা করবে:** Status কলামে "ডেলিভারড" ফিল্টার করে Campaign
অনুযায়ী পিভট করো। এটাই **আসল** cost-per-order।

> Ads Manager দেখায় কতগুলো অর্ডার **হয়েছে**। শিট জানে কতগুলো **দরজায় টিকেছে**।
> COD-তে এই দুটোর মধ্যে ২০-৪০% ফারাক স্বাভাবিক। বাজেট এই দ্বিতীয় সংখ্যা দেখে
> সরাও, প্রথমটা দেখে নয় — নাহলে যে ক্যাম্পেইন বেশি বাতিল অর্ডার আনে, তাতেই
> বেশি টাকা ঢালবে।

---

## ৩. Meta ইভেন্ট ফানেল

| ইভেন্ট | কখন | কী কাজে লাগে |
|---|---|---|
| `PageView` | পেজ লোড | ট্রাফিক |
| `ViewContent` | ল্যান্ডিং পেজ দেখা | রিটার্গেটিং অডিয়েন্স |
| `AddToCart` | কার্টে যোগ | মধ্য-ফানেল সংকেত |
| `InitiateCheckout` | অর্ডার ফর্ম খোলা | **সবচেয়ে দামি অডিয়েন্স** |
| `Purchase` | অর্ডার শিটে সেভ হলে | অপ্টিমাইজেশনের লক্ষ্য |

কাস্টম ইভেন্ট: `scroll_depth`, `cta_click`, `reward_code_copied`,
`cross_sell_dismissed`, `gallery_view`, `video_play`।

### Aggregated Event Measurement (iOS-এর জন্য বাধ্যতামূলক)

Events Manager → Aggregated Event Measurement → প্রাধান্য এই ক্রমে:

```
1. Purchase           ← সর্বোচ্চ
2. InitiateCheckout
3. AddToCart
4. ViewContent
5. Contact
6. PageView
```

**আগে ডোমেইন ভেরিফাই করতে হবে** (`VITE_FB_DOMAIN_VERIFICATION`)। না করলে iOS-এ
প্রথম অপ্ট-আউট ইউজারের পরের সব কনভার্শন হারিয়ে যায়।

---

## ৪. ক্যাম্পেইন গঠন — শুরু করার ছক

### Meta

```
Campaign: Conversions — Purchase
│
├─ Ad Set: Cold — Broad 18-45 BD          → /candy
│    Optimization: Purchase
│    Budget: দৈনিক, ক্যাম্পেইন লেভেলে (CBO)
│
├─ Ad Set: Cold — Interest (Food/Health)  → /combo
│
└─ Ad Set: Retarget — 7 দিনের ভিজিটর       → /candy
     Audience: ViewContent বা InitiateCheckout করেছে, কিন্তু Purchase করেনি
```

**দৈনিক ৫০টার কম Purchase হলে** ad set ভাগ করো না — Meta শিখতেই পারবে না।
একটা broad ad set রেখে creative দিয়ে পরীক্ষা করো।

### সবচেয়ে দামি রিটার্গেটিং অডিয়েন্স

এই সাইট যেসব সংকেত পাঠায়, তা দিয়ে বানাও:

1. `InitiateCheckout` করেছে, `Purchase` করেনি — **সর্বোচ্চ অগ্রাধিকার**।
   ফর্ম খুলেছে মানে দাম দেখেছে, ঠিকানা লিখতে শুরু করেছে।
2. `scroll_depth ≥ 75` কিন্তু অর্ডার নেই — সব পড়েছে, দ্বিধায় আছে।
3. `reward_code_copied` — একবার কিনেছে, আবার আসতে চায়।

### Google Ads

```
Campaign 1: Search — Brand
   কীওয়ার্ড: orree, ওরি, orree chui jhal
   সস্তা, উচ্চ কনভার্শন। প্রথমেই চালাও।

Campaign 2: Search — Non-brand
   কীওয়ার্ড: চুই ঝাল কিনুন, chui jhal price bd

Campaign 3: Performance Max
   Purchase কনভার্শন ৩০/মাস পার হওয়ার পরেই চালাও।
```

---

## ৫. লাইভ করার আগে পরীক্ষা

```
[ ] Meta ডোমেইন ভেরিফাই হয়েছে
[ ] AEM-এ ৮টা ইভেন্টের ক্রম বসানো হয়েছে
[ ] META_TEST_EVENT_CODE দিয়ে টেস্ট অর্ডার — Purchase একবারই দেখাচ্ছে
    (Browser + Server দুটোতেই, dedup ব্যাজ সহ)
[ ] Event Match Quality ৭+/১০
[ ] webhook ব্লক করে টেস্ট — কোনো Purchase ফায়ার হচ্ছে না
[ ] UTM সহ URL খুলে অর্ডার — শিটে Campaign কলাম ভরেছে
[ ] Google Ads auto-tagging চালু
[ ] Google Ads কনভার্শন Tag Assistant-এ দেখাচ্ছে
[ ] META_TEST_EVENT_CODE মুছে ফেলা হয়েছে
```

---

## ৬. প্রথম ৩০ দিনে কী দেখবে

| দিন | কাজ |
|---|---|
| ১-৭ | কিছু বদলিও না। Meta-র শেখার সময়। |
| ৭-১৪ | শিটে ডেলিভারড অনুযায়ী পিভট। কোন ক্যাম্পেইনে বাতিল বেশি? |
| ১৪-৩০ | যে creative-এ ডেলিভারড অর্ডার সবচেয়ে সস্তা, তাতে বাজেট বাড়াও। |

**যে সংখ্যাগুলো আসলে গুরুত্বপূর্ণ:**

- **Cost per delivered order** (Ads Manager-এর CPA নয়) — শিট থেকে
- **Delivery success rate** ক্যাম্পেইন অনুযায়ী — কোনটা ২০% পার হলে সেই
  অডিয়েন্স বা creative-ই সমস্যা
- **Event Match Quality** — ৭-এর নিচে নামলে অপ্টিমাইজেশন দুর্বল হয়
- **Repeat rate** — `reward_code_copied` থেকে
