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
  address: "Gollamari, Sonadanga, Khulna 9100",
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

export const products = [
  {
    id: "chui-jhal-candy",
    title: "চুই ঝাল ক্যান্ডি",
    titleEn: "CANDY",
    shortDesc: "তালমিছরি মিশ্রিত ঐতিহ্যবাহী চুই ঝাল ক্যান্ডি — গলা ব্যথা ও গ্যাস্ট্রিকের আরামদায়ক সঙ্গী।",
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
    image: null,
  },
  {
    id: "chui-jhal-cha-moshla",
    title: "চুই ঝাল চায়ের মসলা",
    titleEn: "TEA MASALA",
    shortDesc: "শীতের সন্ধ্যায় এক কাপ চায়ে যোগ করুন শিকড়ের উষ্ণতা — ঐতিহ্যবাহী চুই ঝাল চায়ের মসলা।",
    ingredients: "চুই ঝাল, আদা, দারুচিনি, এলাচ ও নির্বাচিত মসলা",
    benefits: [
      "ঠান্ডা-কাশি থেকে আরাম দেয়",
      "হজমে সহায়তা করে",
      "শরীর গরম রাখে শীতের দিনে",
    ],
    price: 350,
    compareAtPrice: null,
    currency: "৳",
    weight: "নেট ওজন ১০০ গ্রাম",
    badge: null,
    inStock: true,
    image: null,
  },
  {
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
    badge: "নতুন",
    inStock: true,
    image: null,
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
  title: "আপনার কার্ট",
  subtitle: "ঠিকানা দিন, বাকিটা আমরা বুঝে নেব",
  note: "অর্ডার কনফার্ম করতে সাবমিট করলে হোয়াটসঅ্যাপ খুলে যাবে — সেখান থেকে মেসেজটা পাঠিয়ে দিলেই আমরা দ্রুত যোগাযোগ করব।",
};

// The single object App.jsx keeps in state and passes down as props —
// this is exactly what AdminPanel.jsx would read from and write back to.
export const defaultPageData = {
  brand,
  hero: heroData,
  story: storyData,
  products,
  reviews,
  formData: orderFormData,
};
