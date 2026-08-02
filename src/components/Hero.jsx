import React from "react";
import { ChevronDown } from "lucide-react";
import mascotUrl from "../assets/orree-mascot.svg";
import RatingBadge from "./RatingBadge.jsx";
import useParallax from "../hooks/useParallax.js";
import { averageRating, reviewCount } from "../data/siteData.js";

export default function Hero({ data }) {
  const inkTop = useParallax(0.15, { max: 80 });
  const inkBottom = useParallax(-0.1, { max: 60 });

  const scrollTo = (selector) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden bg-green-deep pt-36 pb-24 sm:pt-44 sm:pb-32">
      {/* ambient brand-ink curl, the site's recurring signature stroke.
          The wrapper drifts with scroll (parallax, GPU-only); the image
          inside keeps its slow float. Two elements so the two transforms
          compose instead of overwriting each other. Both stop under
          reduced-motion. */}
      <div
        ref={inkTop}
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-16 top-24 w-72 sm:w-96 will-change-transform"
      >
        <img src={mascotUrl} alt="" className="w-full opacity-[0.14] animate-float-slow" />
      </div>
      <div
        ref={inkBottom}
        aria-hidden="true"
        className="pointer-events-none select-none absolute -left-24 bottom-0 w-64 sm:w-80 will-change-transform"
      >
        <img src={mascotUrl} alt="" className="w-full opacity-[0.09] rotate-[130deg] animate-drift" />
      </div>

      {/* Soft amber glow — spark, not fill.
          Was a 256px box with blur-[110px]. A blur radius that large forces a
          full-surface Gaussian pass every frame the hero is composited, which
          is measurable jank on the Adreno GPUs in sub-20k BDT Androids. A
          radial-gradient renders identically here and costs nothing. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2"
        style={{
          background:
            "radial-gradient(closest-side, rgba(224,102,31,0.22), rgba(224,102,31,0.09) 45%, transparent 72%)",
        }}
      />

      <div className="container-orree relative">
        <div className="max-w-3xl">
          <p className="eyebrow mb-6 animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse-soft" />
            {data.eyebrow}
          </p>

          <h1
            className="text-balance font-display font-extrabold text-cream text-[2.4rem] leading-[1.15] sm:text-6xl sm:leading-[1.1] animate-fade-up"
            style={{ animationDelay: "0.08s" }}
          >
            {data.headline}
          </h1>

          <p
            className="text-balance mt-6 max-w-xl text-[16px] sm:text-lg leading-relaxed text-cream/75 animate-fade-up"
            style={{ animationDelay: "0.16s" }}
          >
            {data.subtext}
          </p>

          <div className="mt-5 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <RatingBadge rating={averageRating} count={reviewCount} />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up" style={{ animationDelay: "0.24s" }}>
            <button type="button" onClick={() => scrollTo("#story")} className="btn-outline">
              {data.ctaPrimary}
            </button>
            <button type="button" onClick={() => scrollTo("#products")} className="btn-amber">
              {data.ctaSecondary}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollTo("#story")}
        aria-label="নিচে স্ক্রল করুন"
        className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-cream/50 hover:text-amber transition-colors"
      >
        <span className="text-xs tracking-[0.2em] uppercase">স্ক্রল করুন</span>
        <ChevronDown size={18} className="animate-bounce" />
      </button>
    </section>
  );
}
