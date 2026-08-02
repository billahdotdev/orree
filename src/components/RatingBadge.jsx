import React from "react";
import { Star } from "lucide-react";
import useScrollReveal from "../hooks/useScrollReveal.js";
import useCountUp from "../hooks/useCountUp.js";

/**
 * Star rating + review count. Both numbers count up together the first time
 * the badge scrolls into view — one shared visibility trigger drives both, so
 * they stay in sync. A small, modern touch that draws the eye to the social
 * proof. Falls back to the final numbers instantly under reduced-motion.
 */
export default function RatingBadge({ rating, count, className = "" }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.4 });
  const { value: ratingValue } = useCountUp(rating, { duration: 1000, decimals: 1, active: isVisible });
  const { value: countValue } = useCountUp(count, { duration: 1200, active: isVisible });

  return (
    <div ref={ref} className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < Math.round(rating) ? "text-amber fill-amber" : "text-cream/25"}
          />
        ))}
      </div>
      <span className="text-cream/70 text-[13.5px] tabular-nums">
        {ratingValue.toLocaleString("bn-BD")} · {countValue.toLocaleString("bn-BD")}+ রিভিউ থেকে
      </span>
    </div>
  );
}
