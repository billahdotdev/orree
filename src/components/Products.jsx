import React, { useState } from "react";
import { ChevronDown, Check, ShoppingBag, Minus, Plus } from "lucide-react";
import useScrollReveal from "../hooks/useScrollReveal.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { trackViewProduct } from "../tracker.js";
import ProductGallery from "./ProductGallery.jsx";
import useTilt from "../hooks/useTilt.js";

function ProductCard({ product, index }) {
  const { ref, isVisible } = useScrollReveal();
  const tiltRef = useTilt({ max: 6, lift: 0, scale: 1.04 });
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const { buyNow } = useCart();
  const { showToast } = useToast();

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const savings = hasDiscount ? product.compareAtPrice - product.price : 0;

  const toggleOpen = () => {
    setOpen((v) => {
      if (!v) trackViewProduct(product);
      return !v;
    });
  };

  const handleOrder = () => {
    buyNow(product, qty);
    showToast(`${product.title} যোগ হয়েছে`);
  };

  return (
    <div
      ref={ref}
      className={`group flex flex-col rounded-3xl glass glass-interactive overflow-hidden hover:-translate-y-1.5 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${!product.inStock ? "grayscale-[0.4]" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* visual header */}
      <div ref={tiltRef} className="relative h-44 sm:h-52 overflow-hidden [transform-style:preserve-3d]">
        <ProductGallery
          product={product}
          variant="card"
          onOrder={product.inStock ? handleOrder : undefined}
        />

        <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
          {product.badge && (
            <span className="rounded-full bg-amber px-3 py-1 text-[11px] font-semibold tracking-wide text-cream shadow-amber-glow">
              {product.badge}
            </span>
          )}
          {hasDiscount && (
            <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-bold text-green-deep">
              ৳{savings.toLocaleString("bn-BD")} সাশ্রয়
            </span>
          )}
        </div>

        {!product.inStock && (
          <span className="absolute top-4 right-4 z-10 rounded-full bg-green-deeper/80 px-3 py-1 text-[11px] font-semibold text-cream/70">
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

        <div className="mt-6 flex flex-col gap-4 border-t border-cream/10 pt-5">
          <div className="flex items-end justify-between">
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

            {product.inStock && (
              <div className="flex items-center gap-1 rounded-full border border-cream/15 p-1">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="কমান"
                  className="tap h-8 w-8 flex items-center justify-center rounded-full text-cream/70 hover:text-amber"
                >
                  <Minus size={13} />
                </button>
                <span className="w-5 text-center text-cream text-[13.5px] tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  aria-label="বাড়ান"
                  className="tap h-8 w-8 flex items-center justify-center rounded-full text-cream/70 hover:text-amber"
                >
                  <Plus size={13} />
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={handleOrder}
            className="btn-amber w-full !py-3.5 text-[14.5px] disabled:opacity-40 disabled:pointer-events-none"
          >
            <ShoppingBag size={16} />
            {product.inStock ? "অর্ডার করুন" : "স্টক নেই"}
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
