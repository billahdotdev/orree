import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { getProductImages } from "../utils/productImages.js";
import ImageLightbox from "./ImageLightbox.jsx";
import mascotUrl from "../assets/orree-mascot.svg";

/**
 * Product photos — swipe on a phone, arrows on a desktop, tap for fullscreen.
 *
 * Sliding is native scroll-snap rather than a JS carousel: it inherits the
 * platform's own momentum and rubber-banding, costs no bundle weight, and
 * keeps working if JS is slow to boot. The dots and thumbnails just read
 * `scrollLeft` back.
 *
 * Two shapes:
 *   variant="card" — fills whatever box the parent gives it (product cards)
 *   variant="hero" — its own square glass frame plus a thumbnail strip
 *
 * A product with one photo (or none) renders exactly what it used to: no
 * dots, no arrows, no thumbnails.
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Branded stand-in for a missing or broken photo — better than an empty box. */
function Placeholder({ label }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-soft to-green-deeper">
      <img
        src={mascotUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-4 -right-6 w-40 select-none rotate-12 opacity-[0.07]"
      />
      <span className="relative select-none font-display text-[42px] font-extrabold leading-none tracking-wide text-cream/10">
        {label}
      </span>
    </div>
  );
}

/**
 * Fades and un-blurs as the file arrives, over a tinted box of the exact
 * final size — so nothing on the page jumps when a photo lands (CLS).
 */
function GalleryImage({ src, alt, eager }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return <Placeholder label={alt} />;

  return (
    <>
      <span
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-br from-green-soft to-green-deeper transition-opacity duration-700 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        aria-hidden="true"
        className={`bg-noise absolute inset-0 transition-opacity duration-700 ${
          loaded ? "opacity-0" : "opacity-60 animate-pulse-soft"
        }`}
      />
      <img
        src={src}
        alt={alt}
        width="1000"
        height="1000"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`relative h-full w-full object-cover transition-all duration-700 ease-out ${
          loaded ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-md"
        }`}
      />
    </>
  );
}

export default function ProductGallery({ product, variant = "card", className = "", onOrder, orderLabel }) {
  const images = getProductImages(product);
  const trackRef = useRef(null);
  const ticking = useRef(false);
  const [index, setIndex] = useState(0);
  const [lightboxAt, setLightboxAt] = useState(null);

  const multiple = images.length > 1;
  const isHero = variant === "hero";
  const alt = product?.title || "";

  const frameClass = isHero
    ? "relative aspect-square w-full overflow-hidden rounded-3xl glass"
    : "relative h-full w-full overflow-hidden";

  const goTo = (next) => {
    const el = trackRef.current;
    if (!el) return;
    const target = clamp(next, 0, images.length - 1);
    el.scrollTo({
      left: target * el.clientWidth,
      behavior: reducedMotion() ? "auto" : "smooth",
    });
    setIndex(target);
  };

  const handleScroll = () => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      const el = trackRef.current;
      if (!el || !el.clientWidth) return;
      setIndex(clamp(Math.round(el.scrollLeft / el.clientWidth), 0, images.length - 1));
    });
  };

  const handleKeyDown = (e) => {
    if (!multiple) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    }
  };

  if (images.length === 0) {
    return (
      <div className={`${frameClass} ${className}`}>
        <Placeholder label={product?.titleEn || product?.title || ""} />
      </div>
    );
  }

  const gallery = (
    <div className={`group/gallery ${frameClass} ${className}`} onKeyDown={handleKeyDown}>
      <div
        ref={trackRef}
        data-no-bloom
        onScroll={handleScroll}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
      >
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setLightboxAt(i)}
            aria-label={`${alt} — ছবি ${i + 1} বড় করে দেখুন`}
            className="relative h-full w-full shrink-0 snap-center cursor-zoom-in"
          >
            <GalleryImage src={src} alt={alt} eager={i === 0} />
          </button>
        ))}
      </div>

      {/* Desktop arrows — the swipe is the primary control on touch. */}
      {multiple && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="আগের ছবি"
            className="tap absolute left-2.5 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cream/15 bg-green-deep/70 text-cream/80 opacity-0 backdrop-blur transition-opacity hover:border-amber/50 hover:text-amber focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-0 group-hover/gallery:opacity-100 sm:flex"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === images.length - 1}
            aria-label="পরের ছবি"
            className="tap absolute right-2.5 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cream/15 bg-green-deep/70 text-cream/80 opacity-0 backdrop-blur transition-opacity hover:border-amber/50 hover:text-amber focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-0 group-hover/gallery:opacity-100 sm:flex"
          >
            <ChevronRight size={17} />
          </button>
        </>
      )}

      {/* Fullscreen affordance */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-cream/15 bg-green-deep/60 text-cream/70 backdrop-blur transition-opacity ${
          isHero ? "opacity-70" : "opacity-0 group-hover/gallery:opacity-100"
        }`}
      >
        <Maximize2 size={13} />
      </span>

      {multiple && !isHero && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {images.map((src, i) => (
            <span
              key={`dot-${src}-${i}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-4 bg-amber" : "w-1.5 bg-cream/35"
              }`}
            />
          ))}
        </div>
      )}

      {multiple && isHero && (
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-green-deep/70 px-2.5 py-1 text-[11.5px] tabular-nums text-cream/70 backdrop-blur">
          {index + 1} / {images.length}
        </span>
      )}
    </div>
  );

  return (
    <>
      {isHero ? (
        <div className="w-full">
          {gallery}
          {multiple && (
            <div className="no-scrollbar mt-3 flex snap-x gap-2.5 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={`thumb-${src}-${i}`}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`ছবি ${i + 1} দেখুন`}
                  aria-current={i === index}
                  className={`h-16 w-16 shrink-0 snap-start overflow-hidden rounded-xl border transition-colors ${
                    i === index ? "border-amber" : "border-cream/15 hover:border-cream/35"
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        gallery
      )}

      {lightboxAt !== null && (
        <ImageLightbox
          images={images}
          startIndex={lightboxAt}
          title={alt}
          onOrder={onOrder}
          orderLabel={orderLabel}
          onClose={() => setLightboxAt(null)}
        />
      )}
    </>
  );
}
