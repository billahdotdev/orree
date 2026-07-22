import React from "react";
import { Sprout, Leaf, HeartHandshake, Quote } from "lucide-react";
import useScrollReveal from "../hooks/useScrollReveal.js";

const ICONS = {
  sprout: Sprout,
  leaf: Leaf,
  "heart-handshake": HeartHandshake,
};

function ValueCard({ value, index }) {
  const { ref, isVisible } = useScrollReveal();
  const Icon = ICONS[value.icon] || Sprout;

  return (
    <div
      ref={ref}
      className={`glass rounded-3xl p-7 sm:p-8 transition-all duration-700 hover:border-amber/40 hover:-translate-y-1 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/15 text-amber mb-5">
        <Icon size={22} strokeWidth={1.8} />
      </div>
      <h3 className="font-display font-semibold text-xl text-cream mb-2.5">{value.title}</h3>
      <p className="text-cream/70 leading-relaxed text-[15px]">{value.text}</p>
    </div>
  );
}

export default function Story({ data }) {
  const { ref: introRef, isVisible: introVisible } = useScrollReveal();
  const { ref: quoteRef, isVisible: quoteVisible } = useScrollReveal();

  return (
    <section id="story" className="relative bg-green-deep py-24 sm:py-32 scroll-mt-20">
      <div className="container-orree">
        <div
          ref={introRef}
          className={`max-w-2xl transition-all duration-700 ${
            introVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="eyebrow mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
            {data.eyebrow}
          </p>
          <h2 className="text-balance font-display font-bold text-3xl sm:text-4xl text-cream mb-6">
            {data.title}
          </h2>
          <p className="text-cream/70 leading-relaxed text-[15px] sm:text-base">{data.body}</p>
        </div>

        <div
          ref={quoteRef}
          className={`relative mt-14 max-w-3xl rounded-3xl glass-amber px-7 py-9 sm:px-12 sm:py-12 transition-all duration-700 ${
            quoteVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Quote size={30} className="text-amber/50 mb-4" strokeWidth={1.5} />
          <p className="font-quote text-[19px] sm:text-2xl leading-relaxed text-cream text-balance">
            {data.quote}
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {data.values.map((value, i) => (
            <ValueCard key={value.id} value={value} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
