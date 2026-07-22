import React from "react";
import { ChevronDown } from "lucide-react";
import mascotUrl from "../assets/orree-mascot.svg";

export default function Hero({ data }) {
  const scrollTo = (selector) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden bg-green-deep pt-36 pb-24 sm:pt-44 sm:pb-32">
      {/* ambient brand-ink curl, the site's recurring signature stroke */}
      <img
        src={mascotUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-16 top-24 w-72 sm:w-96 opacity-[0.14] animate-float-slow"
      />
      <img
        src={mascotUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute -left-24 bottom-0 w-64 sm:w-80 opacity-[0.09] rotate-[130deg] animate-drift"
      />

      {/* soft amber glow, kept small — spark, not fill */}
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 h-64 w-64 rounded-full bg-amber/20 blur-[110px]" />

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
