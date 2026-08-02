// Central content store — mirrors what AdminPanel.jsx would edit live.
// Nothing here is hardcoded into components; everything flows down as props,
// so the no-code admin panel can overwrite it without touching component code.

export const brand = {
  name: "Orree",
  nameBn: "ওরি",
  tagline: "YOU DESERVE THE FOOD YOU LOVE",
  phone: "01324881188",
  phoneAlt: "09611305599",
  phoneDisplay: "01324-881188",
  whatsapp: "8801324881188",
  email: "hello@orree.bd",
  website: "https://orree.bd",
  social: "/orree.bd",
  facebookPage: "orree.bd",
  messengerUsername: "orree.bd", // used for m.me/orree.bd — update if your Page username differs
  address: "Gollamari, Sonadanga, Khulna 9100",
  // Adjust these two numbers to match your real delivery pricing —
  // everything downstream (cart progress bar, order summary) reads from here.
  // Delivery pricing by courier zone. Currently FREE everywhere — the
  // strongest risk-reversal lever a COD store has, and worth advertising
  // loudly rather than burying in the order summary.
  //
  // The zone selector stays even at ৳0. It still tells your ops team which
  // courier rate to expect and sets the right delivery-time expectation, and
  // when you eventually reintroduce charges the customer sees the real number
  // BEFORE committing — which is what stops refusal-at-the-door, the single
  // biggest cause of COD losses in Bangladesh.
  //
  // To charge again: put real numbers back here (roughly ৳70 inside Dhaka,
  // ৳130 outside, matching your courier's actual rate card). Every free-
  // delivery badge, the progress bar and the order summary all read from this
  // one object, so nothing else needs touching.
  shipping: { insideDhaka: 0, outsideDhaka: 0, flatFee: 0, freeThreshold: 0 },
};

export const heroData = {
  eyebrow: "শিকড়ের স্বাদ, নতুন করে বাঁধা",
  headline: "আপনি যেই খাবার ভালোবাসেন, তার প্রাপ্য আপনি।",
  subtext:
    "দূর গ্রামের কৃষকের আঙিনা থেকে আপনার হাতে পৌঁছানো পর্যন্ত এই দীর্ঘ পথটুকু আমরা হেঁটেছি এক গভীর সততা নিয়ে — প্রকৃতির এই আভিজাত্য আপনার প্রাপ্য, আর তা আপনার হাতে তুলে দিতে পেরে আমরা সত্যিই আনন্দিত।",
  ctaPrimary: "আমাদের গল্প শুনুন",
  ctaSecondary: "প্রোডাক্ট দেখুন",
};

export const storyData = {
  eyebrow: "আমাদের পথচলা",
  title: "সময় বদলেছে, কিন্তু প্রকৃতির প্রতি আমাদের বিশ্বাস বদলায়নি",
  body:
    "ওরি শুরু হয়েছিল একটা ছোট্ট বিশ্বাস থেকে — যে স্বাদ আমাদের ছোটবেলার, দাদি-নানির হাতে বানানো, সেই স্বাদটা আজও বাঁচিয়ে রাখা যায়, শুধু একটু যত্ন আর সততা দিয়ে। আমরা কোনো কারখানা নই, আমরা একটা পরিবার — যারা প্রতিটা ব্যাচ হাতে বানায়, প্রতিটা উপকরণ নিজে বেছে আনে।",
  quote:
    "আমরা বিশ্বাস করি, খাবার শুধু পেট ভরায় না — একটা ভালো খাবার একটা পুরনো স্মৃতিও ফিরিয়ে আনতে পারে।",
  values: [
    {
      id: "v1",
      icon: "sprout",
      title: "খাঁটি উপকরণ",
      text: "কোনো ভেজাল নেই, কোনো শর্টকাট নেই — শুধু প্রকৃতি থেকে সরাসরি আসা উপকরণ, যত্নে বাছাই করা।",
    },
    {
      id: "v2",
      icon: "leaf",
      title: "হাতে বানানো",
      text: "প্রতিটা প্রোডাক্ট ছোট ব্যাচে, হাতে বানানো হয় — যাতে প্রতিটা টুকরোতেই আমাদের যত্নের ছাপ থাকে।",
    },
    {
      id: "v3",
      icon: "heart-handshake",
      title: "আপনার আপনজন",
      text: "আমরা কোনো রোবোটিক ব্র্যান্ড নই — আপনার সাথে আমরা কথা বলি ঠিক যেমন একজন কাছের মানুষ বলে।",
    },
  ],
};

// ⚠️ দাম যাচাই করো — নিচের ★ চিহ্নিত দামগুলো অনুমান করা।
//
// প্রোডাক্ট লিস্টটা তোমার প্রিন্ট করা স্টিকার শিট অনুযায়ী সাজানো হয়েছে।
// স্টিকার থেকে নাম, ওজন আর ধরন নিশ্চিতভাবে পড়া গেছে — কিন্তু দাম স্টিকারে
// লেখা নেই। তাই যেসব দাম আমি অনুমান করেছি সেগুলো ★ দিয়ে চিহ্নিত।
//
// লাইভ করার আগে ★ প্রতিটা দাম ঠিক করে নাও (এখানে অথবা /admin থেকে)।
// COD-তে ভুল দাম মানে ডেলিভারিম্যান দরজায় গিয়ে অন্য টাকা চাইবে — অর্ডার
// বাতিল হবে, রিটার্ন খরচ তোমার ঘাড়ে পড়বে।
//
// ছবি: `public/products/` ফোল্ডারে রেখে নিচে পাথ বসাও। যেগুলোর `images: []`
// খালি, সেগুলো এখন ব্র্যান্ডেড প্লেসহোল্ডার দেখাচ্ছে — ভাঙা ছবি নয়।
export const products = [
  {
    id: "chui-jhal-candy",
    title: "চুই ঝাল ক্যান্ডি",
    titleEn: "CANDY",
    shortDesc: "ঝাল-মিষ্টি স্বাদের ঐতিহ্যবাহী চুই ঝাল ক্যান্ডি — গলা ব্যথা ও গ্যাস্ট্রিকের আরামদায়ক সঙ্গী।",
    ingredients: "চুই ঝাল, তালমিছরি, মধু এবং খাঁটি ঘি",
    benefits: [
      "গ্যাস্ট্রিক ও পেটের অস্বস্তি দূর করতে সাহায্য করে",
      "গলা ব্যথা ও শরীরের ক্লান্তি দূর করতে কার্যকরী",
      "রোগ প্রতিরোধ ক্ষমতা বাড়ায় ও তাৎক্ষণিক শক্তি জোগায়",
    ],
    price: 1000,
    compareAtPrice: null,
    currency: "৳",
    weight: "নেট ওজন ৫০০ গ্রাম",
    badge: "সিগনেচার",
    inStock: true,
    images: [
      "/products/chui-jhal-candy.webp",
      "/products/chui-jhal-candy-2.webp",
      "/products/chui-jhal-candy-3.webp",
    ],
  },
  {
    // স্টিকারে এটা "চুইঝাল মিছরি মসলা", ৫০০ গ্রাম — সাইটে ছিল "চুই ঝাল চায়ের
    // মসলা", ১০০ গ্রাম, ৳৩৫০। দুটো এক জিনিস নয়। id পুরনোটাই রাখা হয়েছে যাতে
    // /moshla ল্যান্ডিং পেজ, পুরনো বিজ্ঞাপনের লিংক আর শিটে থাকা পুরনো অর্ডার
    // সারি সব অক্ষত থাকে।
    id: "chui-jhal-cha-moshla",
    title: "চুই ঝাল মিছরি মসলা",
    titleEn: "MISRI MOSHLA",
    shortDesc: "প্রথমে মিষ্টি, শেষে ঝাল — মুখে দিলেই বোঝা যায় কেন এটা সবার প্রিয়।",
    ingredients: "চুই ঝাল, তালমিছরি ও নির্বাচিত প্রাকৃতিক মসলা",
    benefits: [
      "প্রাকৃতিক উপাদানে তৈরি, নিরাপদ ও মুখরোচক",
      "হজমে সহায়তা করে ও মুখের রুচি ফেরায়",
      "কৃত্রিম রঙ বা প্রিজারভেটিভ মুক্ত",
    ],
    price: 900, // ★ অনুমান — ওজন ১০০ গ্রাম থেকে ৫০০ গ্রামে বেড়েছে, তাই পুরনো ৳৩৫০ আর খাটে না
    compareAtPrice: null,
    currency: "৳",
    weight: "নেট ওজন ৫০০ গ্রাম",
    badge: null,
    inStock: true,
    images: [
      "/products/chui-jhal-cha-moshla.webp",
      "/products/chui-jhal-cha-moshla-2.webp",
      "/products/chui-jhal-cha-moshla-3.webp",
    ],
  },
  {
    // কম্বো প্যাক — স্টিকার শিটে আলাদা স্টিকার আছে, মানে এটা আলাদা SKU।
    // COD-তে কম্বো সবচেয়ে শক্তিশালী: গড় অর্ডার ভ্যালু বাড়ে, আর "দুটোই একবারে
    // চেখে দেখি" — এই সিদ্ধান্তটা নেওয়া নতুন ক্রেতার জন্য সবচেয়ে সহজ।
    id: "chui-jhal-combo",
    title: "চুই ঝাল কম্বো প্যাক",
    titleEn: "COMBO",
    shortDesc: "মিছরি মসলা ২৫০ গ্রাম + ক্যান্ডি ২৫০ গ্রাম — দুটো স্বাদই একসাথে, এক প্যাকেই।",
    ingredients: "চুই ঝাল, তালমিছরি, মধু, খাঁটি ঘি ও নির্বাচিত প্রাকৃতিক মসলা",
    benefits: [
      "দুটো প্রোডাক্ট একসাথে — আলাদা কিনলে যা পড়ত, তার চেয়ে কম",
      "প্রথমবার চেখে দেখার জন্য সবচেয়ে ভালো প্যাক",
      "উপহার দেওয়ার জন্যও উপযুক্ত",
    ],
    // ★ অনুমান। হিসাবটা এভাবে: ক্যান্ডি ৫০০ গ্রাম ৳১০০০ → ২৫০ গ্রাম ≈ ৳৫০০।
    // মিছরি মসলা ৫০০ গ্রাম ৳৯০০ → ২৫০ গ্রাম ≈ ৳৪৫০। মোট ≈ ৳৯৫০।
    // তাই compareAtPrice ৳৯৫০, আর কম্বোর দাম তার চেয়ে কম — ৳৮৫০।
    //
    // ⚠️ compareAtPrice কখনো বাড়িয়ে লিখো না। "৳১৯০০ কাটা, এখন ৳৯৫০" লিখলে
    // সেটা মিথ্যা ছাড় — কাস্টমার নিজে হিসাব করলেই ধরে ফেলবে, আর ভোক্তা
    // অধিকার আইনেও এটা সমস্যা। কাটা দামটা সবসময় আসল আলাদা দামের যোগফল হবে।
    price: 850,
    compareAtPrice: 950,
    currency: "৳",
    weight: "নেট ওজন ৫০০ গ্রাম (২৫০ + ২৫০)",
    badge: "সেরা ভ্যালু",
    inStock: true,
    images: [], // ছবি এলে এখানে পাথ বসাও
  },
  {
    // স্টিকার শিটে আছে, সাইটে ছিল না।
    id: "date-seed-coffee",
    title: "খেজুর বীজের কফি",
    titleEn: "DATE SEED COFFEE",
    shortDesc: "ক্যাফেইন-মুক্ত খেজুর বীজের কফি — রাতে খেলেও ঘুমের কোনো সমস্যা নেই।",
    ingredients: "১০০% রোস্টেড খেজুরের বীজ",
    benefits: [
      "সম্পূর্ণ ক্যাফেইন-মুক্ত — রাতেও নিশ্চিন্তে খাওয়া যায়",
      "কফির স্বাদ, কিন্তু বুক ধড়ফড় বা অস্থিরতা নেই",
      "কোনো কৃত্রিম উপাদান নেই",
    ],
    price: 550, // ★ অনুমান
    compareAtPrice: null,
    currency: "৳",
    weight: "নেট ওজন ২০০ গ্রাম",
    badge: "নতুন",
    inStock: true,
    images: [], // ছবি এলে এখানে পাথ বসাও
  },
  {
    // স্টিকার শিটে "বাইটস"-এর কোনো স্টিকার নেই। বন্ধ করে দেওয়া হয়নি —
    // স্টিকার না থাকা মানেই প্রোডাক্ট নেই, তা নয়। কিন্তু যদি সত্যিই আর না
    // বানাও, তাহলে হয় `inStock: false` করো, নয়তো পুরো ব্লকটা মুছে দাও।
    id: "chui-jhal-bites",
    title: "চুই ঝাল বাইটস",
    titleEn: "BITES",
    shortDesc: "কাজের ফাঁকে ছোট্ট একটা খুশির টুকরো — মুখরোচক ও স্বাস্থ্যকর চুই ঝাল বাইটস।",
    ingredients: "চুই ঝাল, বাদাম, গুড় ও প্রাকৃতিক মসলা",
    benefits: [
      "চটজলদি এনার্জি স্ন্যাক হিসেবে দারুণ",
      "কৃত্রিম চিনি বা প্রিজারভেটিভ মুক্ত",
      "যেকোনো সময়ের হালকা ক্ষুধা মেটাতে উপযুক্ত",
    ],
    price: 450,
    compareAtPrice: 500,
    currency: "৳",
    weight: "নেট ওজন ২০০ গ্রাম",
    badge: null,
    inStock: true,
    images: [
      "/products/chui-jhal-bites.webp",
      "/products/chui-jhal-bites-2.webp",
      "/products/chui-jhal-bites-3.webp",
    ],
  },
];

export const reviews = [
  {
    id: "r1",
    name: "নুসরাত জাহান",
    location: "খুলনা",
    rating: 5,
    text: "চুই ঝাল ক্যান্ডিটা খেয়ে সত্যিই দাদির হাতের বানানো জিনিসের কথা মনে পড়ে গেল। প্যাকেজিং থেকে শুরু করে স্বাদ — সব কিছুতেই যত্নের ছাপ।",
  },
  {
    id: "r2",
    name: "রাকিবুল হাসান",
    location: "ঢাকা",
    rating: 5,
    text: "গ্যাস্ট্রিকের সমস্যার জন্য অনেক কিছু ট্রাই করেছি, কিন্তু এই ক্যান্ডিটা আসলেই আরাম দেয়। আর হোয়াটসঅ্যাপে অর্ডার করাটাও দারুণ সহজ ছিল।",
  },
  {
    id: "r3",
    name: "সাদিয়া ইসলাম",
    location: "চট্টগ্রাম",
    rating: 4,
    text: "চায়ের মসলাটা এখন প্রতিদিনের রুটিনের অংশ হয়ে গেছে। শীতের সন্ধ্যায় এক কাপ চা আরও উষ্ণ লাগে এখন।",
  },
  {
    id: "r4",
    name: "তানভীর আহমেদ",
    location: "খুলনা",
    rating: 5,
    text: "ডেলিভারি দ্রুত ছিল, আর প্রোডাক্টের কোয়ালিটি এক্সপেক্টেশনের চেয়ে ভালো। বাইটসগুলো অফিসে নিয়ে যাই এখন।",
  },
];

export const orderFormData = {
  title: "অর্ডার করুন",
  subtitle: "মাত্র ৩টি তথ্য — বাকিটা আমরা বুঝে নেব",
  note: "অর্ডার কনফার্ম করলেই আমরা আপনার নম্বরে কল করে সব নিশ্চিত করে নেব। কোনো অগ্রিম পেমেন্ট লাগবে না।",
};

// ── Meta-ad landing pages (campaigns) ────────────────────────────────
//
// Each campaign is a standalone offer page at /lp/<slug>, driven by one
// base product but able to override headline, price, images, badge, CTA and
// an honest offer deadline — all editable live from /admin, no code change.
// Empty override fields fall back to the base product's own values, so a
// campaign is as light or as detailed as you want.
//
// The two original routes (/candy, /moshla) are seeded here as campaigns so
// any existing links keep working; they also still resolve if you delete the
// campaign (they fall back to the base product).
export const campaigns = [
  {
    id: "cmp-candy",
    slug: "candy",
    productId: "chui-jhal-candy",
    active: true,
    eyebrow: "",
    headline: "",
    subheadline: "",
    badge: "",
    price: null,
    compareAtPrice: null,
    ctaText: "এখনই অর্ডার করুন",
    images: [],
    benefits: [],
    offerEndsAt: null,
    showReviews: true,
    source: "lp-candy",
    metaTitle: "",
    metaDescription: "",
  },
  {
    id: "cmp-moshla",
    slug: "moshla",
    productId: "chui-jhal-cha-moshla",
    active: true,
    eyebrow: "",
    headline: "",
    subheadline: "",
    badge: "",
    price: null,
    compareAtPrice: null,
    ctaText: "এখনই অর্ডার করুন",
    images: [],
    benefits: [],
    offerEndsAt: null,
    showReviews: true,
    source: "lp-moshla",
    metaTitle: "",
    metaDescription: "",
  },
  {
    id: "cmp-combo",
    slug: "combo",
    productId: "chui-jhal-combo",
    active: true,
    eyebrow: "",
    headline: "",
    subheadline: "",
    badge: "",
    price: null,
    compareAtPrice: null,
    ctaText: "এখনই অর্ডার করুন",
    images: [],
    benefits: [],
    offerEndsAt: null,
    showReviews: true,
    source: "lp-combo",
    metaTitle: "",
    metaDescription: "",
  },
  {
    id: "cmp-coffee",
    slug: "coffee",
    productId: "date-seed-coffee",
    active: true,
    eyebrow: "",
    headline: "",
    subheadline: "",
    badge: "",
    price: null,
    compareAtPrice: null,
    ctaText: "এখনই অর্ডার করুন",
    images: [],
    benefits: [],
    offerEndsAt: null,
    showReviews: true,
    source: "lp-coffee",
    metaTitle: "",
    metaDescription: "",
  },
];

// ── পরের অর্ডারের রিওয়ার্ড ────────────────────────────────────────────
// প্রতিটা প্যাকেটের সাথে যে ছাপানো চিঠি যায়, এই লেখাটা হুবহু সেটার মতোই।
//
// এটা খুব জরুরি: চিঠিতে লেখা আছে "১০% অতিরিক্ত পণ্য ফ্রি" — "১০% ছাড়" নয়।
// দুটো সম্পূর্ণ আলাদা জিনিস। ওয়েবসাইটে একটা আর চিঠিতে আরেকটা লেখা থাকলে
// কাস্টমার পরের বার ফোন করে তর্ক করবে, আর তোমার টিম মাঝখানে পড়বে।
// লেখা বদলালে দুই জায়গাতেই একসাথে বদলাও।
//
// ব্যবসার দিক থেকেও "অতিরিক্ত পণ্য" বেশি ভালো: ১০% ছাড়ে তোমার পুরো মার্জিন
// থেকে টাকা কাটে, কিন্তু ১০% বেশি পণ্যে শুধু উৎপাদন খরচটুকু যায় — আর পরের
// অর্ডারের ঝুড়িও বড় হয়।
export const repeatOffer = {
  enabled: true,
  headline: "পরের অর্ডারে ১০% অতিরিক্ত পণ্য — একদম ফ্রি",
  detail: "আপনার প্যাকেটের ভেতরে এই কোডটা লেখা চিঠিও পাবেন। পরের বার অর্ডারের সময় কোডটা বললেই হবে।",
  codePrefix: "ORREE10",
  // 0 = মেয়াদ নেই। ছাপানো চিঠিতে কোনো মেয়াদ লেখা নেই, তাই ডিফল্ট ০ —
  // ওয়েবসাইটে মেয়াদ দেখালে চিঠির সাথে অমিল হয়ে যেত।
  // চিঠির পরের প্রিন্টে মেয়াদ যোগ করলে এখানে দিন সংখ্যা বসাও (যেমন 30)।
  validDays: 0,
};

// The blank template /admin clones when you add a new product.
export const blankProduct = {
  title: "নতুন প্রোডাক্ট",
  titleEn: "NEW",
  shortDesc: "",
  ingredients: "",
  benefits: [],
  price: 0,
  compareAtPrice: null,
  currency: "৳",
  weight: "",
  badge: null,
  inStock: true,
  images: [],
  image: null,
};

// The blank template /admin clones when you create a new landing page.
export const blankCampaign = {
  slug: "",
  productId: "",
  active: true,
  eyebrow: "",
  headline: "",
  subheadline: "",
  badge: "",
  price: null,
  compareAtPrice: null,
  ctaText: "এখনই অর্ডার করুন",
  images: [],
  benefits: [],
  offerEndsAt: null,
  showReviews: true,
  source: "",
  metaTitle: "",
  metaDescription: "",
};

export const averageRating =
  Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
export const reviewCount = reviews.length;

// The single object App.jsx keeps in state and passes down as props —
// this is exactly what AdminPanel.jsx would read from and write back to.
export const defaultPageData = {
  brand,
  hero: heroData,
  story: storyData,
  products,
  reviews,
  formData: orderFormData,
  campaigns,
  repeatOffer,
};
