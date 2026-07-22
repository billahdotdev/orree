import React from "react";
import { Star } from "lucide-react";
import useScrollReveal from "../hooks/useScrollReveal.js";

function ReviewCard({ review, index }) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`glass rounded-3xl p-7 flex flex-col transition-all duration-700 hover:border-amber/30 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <div className="flex gap-1 mb-4" aria-label={`${review.rating} তারা রেটিং`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={15}
            className={i < review.rating ? "text-amber fill-amber" : "text-cream/20"}
          />
        ))}
      </div>
      <p className="text-cream/80 leading-relaxed text-[14.5px] flex-1">&ldquo;{review.text}&rdquo;</p>
      <div className="mt-5 pt-4 border-t border-cream/10">
        <p className="font-display font-semibold text-cream text-[15px]">{review.name}</p>
        <p className="text-cream/50 text-[13px]">{review.location}</p>
      </div>
    </div>
  );
}

export default function Reviews({ reviews }) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="reviews" className="relative bg-green-deep py-24 sm:py-32 scroll-mt-20 overflow-hidden">
      <div className="container-orree">
        <div
          ref={ref}
          className={`max-w-xl mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="eyebrow mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
            যা বলছেন সবাই
          </p>
          <h2 className="text-balance font-display font-bold text-3xl sm:text-4xl text-cream mb-4">
            আপনাদের ভালোলাগার কিছু কথা
          </h2>
          <p className="text-cream/65 leading-relaxed">
            প্রতিটা রিভিউ আসলে একটা ছোট্ট স্মৃতি — আমরা সেগুলোই সবচেয়ে বেশি যত্ন করে রাখি।
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
