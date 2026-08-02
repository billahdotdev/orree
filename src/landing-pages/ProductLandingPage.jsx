import React, { useEffect, useState } from "react";
import { Check, Star, Minus, Plus, ShieldCheck, Truck, BadgeCheck } from "lucide-react";
import logoUrl from "../assets/orree-logo.svg";
import mascotUrl from "../assets/orree-mascot.svg";
import { trackViewProduct, trackCtaClick } from "../tracker.js";
import usePageMeta from "../hooks/usePageMeta.js";
import RatingBadge from "../components/RatingBadge.jsx";
import TrustBadges from "../components/TrustBadges.jsx";
import OrderForm from "../components/OrderForm.jsx";
import FloatingContactButtons from "../components/FloatingContactButtons.jsx";
import ProductGallery from "../components/ProductGallery.jsx";
import OfferDeadline from "../components/OfferDeadline.jsx";
import { CartProvider, useCart } from "../context/CartContext.jsx";
import { ToastProvider } from "../context/ToastContext.jsx";
import { getProductImages } from "../utils/productImages.js";
import { averageRating, reviewCount, orderFormData } from "../data/siteData.js";

/**
 * Single-product ad-campaign page — the whole thing, in one place.
 *
 * /candy and /moshla are just this template handed a different product.
 * They used to be two byte-for-byte copies that had to be edited in
 * lockstep; now there is one source of truth. Add a new campaign route by
 * pointing another <ProductLandingPage product={...} /> at it — no copying.
 *
 * Lives entirely outside the main SPA's tree on purpose, with its own
 * CartProvider (persist=false) so it never shares cart state or a
 * localStorage key with the main site.
 */

const MINI_FAQS = [
  { q: "পেমেন্ট কীভাবে করব?", a: "ক্যাশ অন ডেলিভারি — প্রোডাক্ট হাতে পেয়ে টাকা দিলেই হবে।" },
  { q: "ডেলিভারি পেতে কত সময় লাগে?", a: "সাধারণত ১-৪ কার্যদিবসের মধ্যে অর্ডার পৌঁছে যায়।" },
];

function LandingContent({ product, brand, reviews, offer, repeatOffer }) {
  const [qty, setQty] = useState(1);
  const { addItem, clearCart, openOrderForm } = useCart();

  const eyebrowText = offer.eyebrow || product.badge;
  const ctaText = offer.ctaText;

  // Canonical must be the campaign's own clean URL, not whatever path the
  // visitor happened to arrive on.
  usePageMeta(
    offer.metaTitle || product.title,
    offer.metaDescription || product.shortDesc,
    offer.canonicalPath
  );

  useEffect(() => {
    trackViewProduct(product);

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.shortDesc,
      image: getProductImages(product),
      brand: { "@type": "Brand", name: "Orree" },
      aggregateRating: { "@type": "AggregateRating", ratingValue: averageRating, reviewCount },
      offers: {
        "@type": "Offer",
        priceCurrency: "BDT",
        price: product.price,
        availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    });
    document.head.appendChild(script);
    // .remove() is a no-op on an already-detached node; removeChild throws.
    return () => script.remove();
  }, [product]);

  // Landing page cart always holds exactly this one product at the chosen qty.
  const handleOrderClick = (ctaLocation) => {
    trackCtaClick(ctaLocation, "landing");
    clearCart();
    addItem(product, qty);
    openOrderForm();
  };

  const featuredReviews = reviews.slice(0, 3);
  const hasPhotos = getProductImages(product).length > 0;

  return (
    <div className="min-h-screen bg-green-deep text-cream font-body pb-24 sm:pb-0">
      <header className="container-orree pt-7 pb-4 flex justify-center">
        <img src={logoUrl} alt="Orree" className="h-9 w-auto" />
      </header>

      <main className="relative overflow-hidden">
        <img
          src={mascotUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -right-20 top-10 w-80 opacity-[0.1] animate-float-slow"
        />

        <section className="container-orree pt-8 pb-12 sm:pt-14 sm:pb-16 text-center max-w-2xl">
          {eyebrowText && (
            <p className="eyebrow justify-center mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              {eyebrowText}
            </p>
          )}
          <h1 className="text-balance font-display font-extrabold text-3xl sm:text-5xl leading-tight mb-4">
            {product.title}
          </h1>

          <OfferDeadline offerEndsAt={offer.offerEndsAt} />

          <div className="flex justify-center mb-5">
            <RatingBadge rating={averageRating} count={reviewCount} />
          </div>

          {hasPhotos && (
            <div className="mx-auto mb-8 max-w-sm">
              <ProductGallery
                product={product}
                variant="hero"
                orderLabel={ctaText}
                onOrder={product.inStock ? () => handleOrderClick("lightbox_order") : undefined}
              />
            </div>
          )}

          <p className="text-cream/75 text-[16px] sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            {product.shortDesc}
          </p>

          <div className="flex items-baseline justify-center gap-3 mb-2">
            <span className="font-display font-bold text-4xl text-cream">
              {product.currency}
              {product.price.toLocaleString("bn-BD")}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-cream/40 text-lg line-through">
                {product.currency}
                {product.compareAtPrice.toLocaleString("bn-BD")}
              </span>
            )}
          </div>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <p className="mb-2 inline-block rounded-full bg-cream/10 px-3 py-1 text-[12.5px] text-cream/80">
              ৳{(product.compareAtPrice - product.price).toLocaleString("bn-BD")} সাশ্রয়
            </p>
          )}
          <p className="text-cream/50 text-[13px] mb-8">{product.weight}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-1 rounded-full border border-cream/20 p-1.5">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="কমান"
                className="h-9 w-9 flex items-center justify-center rounded-full text-cream/70 hover:text-amber"
              >
                <Minus size={15} />
              </button>
              <span className="w-8 text-center text-cream text-[15px] font-medium">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                aria-label="বাড়ান"
                className="h-9 w-9 flex items-center justify-center rounded-full text-cream/70 hover:text-amber"
              >
                <Plus size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOrderClick("hero_order")}
              disabled={!product.inStock}
              className="btn-amber text-base px-9 py-4 w-full sm:w-auto disabled:opacity-50"
            >
              {/* No chat glyph. This button posts a real order to the Google
                  Sheet backend — a speech bubble promised "this opens a chat",
                  which is a different, lower-commitment action. Mismatched
                  icons cost trust at exactly the wrong moment. */}
              {product.inStock ? ctaText : "স্টক নেই"}
            </button>
          </div>

          {/* Three badges now, so wrap rather than squeeze on a 360px screen.
              Distinct icons per badge — two identical shields side by side
              read as one repeated item and the eye skips the second. */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-cream/50 text-[12.5px]">
            <span className="inline-flex items-center gap-1.5">
              <Truck size={13} className="text-amber" /> ফ্রি ডেলিভারি
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-amber" /> ক্যাশ অন ডেলিভারি
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={13} className="text-amber" /> ১০০% অরিজিনাল
            </span>
          </div>

          <div className="mt-14 glass rounded-3xl p-7 sm:p-9 text-left">
            <p className="text-[13.5px] text-cream/60 mb-4">
              <span className="text-cream/85 font-medium">উপাদান: </span>
              {product.ingredients}
            </p>
            <ul className="space-y-2.5">
              {product.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[14.5px] text-cream/75">
                  <Check size={16} className="mt-0.5 shrink-0 text-amber" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <TrustBadges />

        {offer.showReviews && featuredReviews.length > 0 && (
          <section className="container-orree py-14 sm:py-20">
            <h2 className="text-center font-display font-bold text-2xl sm:text-3xl text-cream mb-10">
              যা বলছেন আমাদের কাস্টমাররা
            </h2>
            <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
              {featuredReviews.map((review) => (
                <div key={review.id} className="glass rounded-2xl p-6">
                  <div className="flex gap-1 mb-3" aria-label={`${review.rating} তারা রেটিং`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < review.rating ? "text-amber fill-amber" : "text-cream/20"} />
                    ))}
                  </div>
                  <p className="text-cream/75 text-[14px] leading-relaxed mb-4">&ldquo;{review.text}&rdquo;</p>
                  <p className="text-cream text-[13.5px] font-medium">{review.name}</p>
                  <p className="text-cream/45 text-[12px]">{review.location}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="container-orree pb-16 sm:pb-24 max-w-2xl">
          <h2 className="text-center font-display font-bold text-2xl text-cream mb-6">প্রায়ই জিজ্ঞাসিত প্রশ্ন</h2>
          <div className="space-y-3">
            {MINI_FAQS.map((item) => (
              <div key={item.q} className="glass rounded-2xl p-5">
                <p className="font-display font-medium text-cream text-[14.5px] mb-1.5">{item.q}</p>
                <p className="text-cream/60 text-[13.5px] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="container-orree py-8 text-center text-cream/40 text-[12.5px]">
        © {new Date().getFullYear()} Orree | ওরি — {brand.phoneDisplay}
      </footer>

      {/* Mobile sticky CTA — one thumb-reach away no matter how far scrolled */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 px-4 pt-2 safe-bottom">
        <button
          type="button"
          onClick={() => handleOrderClick("sticky_order")}
          disabled={!product.inStock}
          className="flex items-center justify-center gap-2 w-full rounded-full bg-amber py-3.5 shadow-amber-glow font-display font-semibold text-cream text-[14.5px] disabled:opacity-50"
        >
          {/* Surface the quantity: the stepper is up in the hero, so a user
              who scrolled to the reviews has no idea what they're committing to. */}
          {qty > 1 && <span className="opacity-80">{qty}টি · </span>}
          {product.currency}
          {(product.price * qty).toLocaleString("bn-BD")} — অর্ডার করুন
        </button>
      </div>

      <OrderForm
        brand={brand}
        formData={orderFormData}
        products={[product]}
        source={offer.source}
        repeatOffer={repeatOffer}
      />
      <FloatingContactButtons brand={brand} />
    </div>
  );
}

/**
 * The campaign landing page. Accepts a resolved offer (see
 * utils/campaigns.js → resolveCampaign) so all the fallback logic lives in
 * one place. Also accepts a plain `product` for the rare case of rendering a
 * product directly without a campaign. Owns an isolated, non-persisted cart
 * so an offer page never touches the main site's cart state.
 */
export default function ProductLandingPage({ resolved, product, brand, reviews = [], repeatOffer }) {
  // Normalise: if we were handed a bare product, wrap it as a no-override offer.
  const offer = resolved || {
    product,
    eyebrow: "",
    ctaText: "এখনই অর্ডার করুন",
    offerEndsAt: null,
    showReviews: true,
    source: undefined,
    metaTitle: product?.title,
    metaDescription: product?.shortDesc,
  };

  if (!offer.product) return null;

  return (
    <ToastProvider>
      <CartProvider persist={false}>
        <LandingContent
          product={offer.product}
          brand={brand}
          reviews={reviews}
          offer={offer}
          repeatOffer={repeatOffer}
        />
      </CartProvider>
    </ToastProvider>
  );
}
