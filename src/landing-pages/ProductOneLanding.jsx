import React, { useEffect } from "react";
import { MessageCircle, Check } from "lucide-react";
import logoUrl from "../assets/orree-logo.svg";
import mascotUrl from "../assets/orree-mascot.svg";
import { trackViewProduct, trackWhatsAppClick } from "../tracker.js";
import usePageMeta from "../hooks/usePageMeta.js";

/**
 * Isolated single-product ad-campaign page — lives entirely outside the
 * main SPA's component tree on purpose. Safe to delete this file and its
 * route in App.jsx once the campaign ends; nothing else depends on it.
 */
export default function ProductOneLanding({ product, brand }) {
  usePageMeta(product.title, product.shortDesc);

  useEffect(() => {
    trackViewProduct(product);

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.shortDesc,
      brand: { "@type": "Brand", name: "Orree" },
      offers: {
        "@type": "Offer",
        priceCurrency: "BDT",
        price: product.price,
        availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    });
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, [product]);

  const message = `আসসালামু আলাইকুম, Orree থেকে "${product.title}" অর্ডার করতে চাই।`;
  const waLink = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;

  return (
    <div className="min-h-screen bg-green-deep text-cream font-body">
      <header className="container-orree pt-8 pb-4 flex justify-center">
        <img src={logoUrl} alt="Orree" className="h-9 w-auto" />
      </header>

      <main className="relative overflow-hidden">
        <img
          src={mascotUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -right-20 top-10 w-80 opacity-[0.1] animate-float-slow"
        />

        <section className="container-orree py-12 sm:py-20 text-center max-w-2xl">
          <p className="eyebrow justify-center mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
            সিগনেচার প্রোডাক্ট
          </p>
          <h1 className="text-balance font-display font-extrabold text-3xl sm:text-5xl leading-tight mb-5">
            {product.title}
          </h1>
          <p className="text-cream/75 text-[16px] sm:text-lg leading-relaxed mb-8">{product.shortDesc}</p>

          <div className="flex items-baseline justify-center gap-3 mb-8">
            <span className="font-display font-bold text-4xl text-cream">
              {product.currency}
              {product.price.toLocaleString("bn-BD")}
            </span>
            <span className="text-cream/50">{product.weight}</span>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick(`landing_${product.id}`)}
            className="btn-amber text-base px-9 py-4"
          >
            <MessageCircle size={18} />
            হোয়াটসঅ্যাপে অর্ডার করুন
          </a>

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
      </main>

      <footer className="container-orree py-8 text-center text-cream/40 text-[12.5px]">
        © {new Date().getFullYear()} Orree | ওরি — {brand.phoneDisplay}
      </footer>
    </div>
  );
}
