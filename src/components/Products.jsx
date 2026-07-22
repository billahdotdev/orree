import React, { useState } from "react";
import { ChevronDown, Check, ShoppingBag } from "lucide-react";
import useScrollReveal from "../hooks/useScrollReveal.js";
import { useCart } from "../context/CartContext.jsx";
import { trackViewProduct } from "../tracker.js";

function ProductCard({ product, index }) {
  const { ref, isVisible } = useScrollReveal();
  const [open, setOpen] = useState(false);
  const { buyNow } = useCart();

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  const toggleOpen = () => {
    setOpen((v) => {
      if (!v) trackViewProduct(product);
      return !v;
    });
  };

  return (
    <div
      ref={ref}
      className={`group flex flex-col rounded-3xl glass overflow-hidden transition-all duration-700 hover:border-amber/40 hover:-translate-y-1.5 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${!product.inStock ? "grayscale-[0.4]" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* visual header */}
      <div className="relative h-44 sm:h-48 bg-gradient-to-br from-green-soft to-green-deeper flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-5xl font-extrabold text-cream/10 select-none">
            {product.titleEn}
          </span>
        )}
        {product.badge && (
          <span className="absolute top-4 left-4 rounded-full bg-amber px-3 py-1 text-[11px] font-semibold tracking-wide text-cream">
            {product.badge}
          </span>
        )}
        {!product.inStock && (
          <span className="absolute top-4 right-4 rounded-full bg-green-deeper/80 px-3 py-1 text-[11px] font-semibold text-cream/70">
            স্টক নেই
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-display font-semibold text-xl text-cream">{product.title}</h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-cream/65 flex-1">{product.shortDesc}</p>

        <button
          type="button"
          onClick={toggleOpen}
          className="mt-4 inline-flex items-center gap-1.5 self-start text-[13.5px] font-medium text-amber/90 hover:text-amber transition-colors"
          aria-expanded={open}
        >
          {open ? "সংক্ষেপে দেখুন" : "বিস্তারিত দেখুন"}
          <ChevronDown size={15} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>

        <div
          className={`grid transition-all duration-400 ease-out ${
            open ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <p className="text-[13.5px] text-cream/60 mb-3">
              <span className="text-cream/80 font-medium">উপাদান: </span>
              {product.ingredients}
            </p>
            <ul className="space-y-1.5 mb-1">
              {product.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[13.5px] text-cream/65">
                  <Check size={14} className="mt-0.5 shrink-0 text-amber" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-cream/10 pt-5">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-2xl text-cream">
                {product.currency}
                {product.price.toLocaleString("bn-BD")}
              </span>
              {hasDiscount && (
                <span className="text-sm text-cream/40 line-through">
                  {product.currency}
                  {product.compareAtPrice.toLocaleString("bn-BD")}
                </span>
              )}
            </div>
            <span className="text-[12.5px] text-cream/50">{product.weight}</span>
          </div>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => buyNow(product)}
            className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-[14px] font-semibold text-cream transition-all duration-300 hover:bg-amber-deep hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ShoppingBag size={16} />
            অর্ডার করুন
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products({ products }) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="products" className="relative bg-green-deeper py-24 sm:py-32 scroll-mt-20">
      <div className="container-orree">
        <div
          ref={ref}
          className={`max-w-xl mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="eyebrow mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
            যা আমরা বানাই
          </p>
          <h2 className="text-balance font-display font-bold text-3xl sm:text-4xl text-cream mb-4">
            হাতে বানানো, মন দিয়ে বাছাই করা
          </h2>
          <p className="text-cream/65 leading-relaxed">
            প্রতিটা প্রোডাক্ট ছোট ব্যাচে তৈরি হয় — যাতে প্রতিটা টুকরোতেই যত্নের ছাপ থাকে।
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
