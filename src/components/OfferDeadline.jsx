import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { offerTimeLeft } from "../utils/campaigns.js";

/**
 * Shows a real, honest offer deadline — nothing else.
 *
 * Brand rule (see HANDOFF §7): no fake countdowns, no manufactured scarcity.
 * This renders ONLY when the campaign has a genuine future `offerEndsAt`, and
 * it removes itself the moment that time passes. A ticking clock here is the
 * truth, not a pressure tactic.
 */
export default function OfferDeadline({ offerEndsAt }) {
  const [left, setLeft] = useState(() => offerTimeLeft(offerEndsAt));

  useEffect(() => {
    setLeft(offerTimeLeft(offerEndsAt));
    if (!offerEndsAt) return undefined;
    const t = setInterval(() => setLeft(offerTimeLeft(offerEndsAt)), 30000);
    return () => clearInterval(t);
  }, [offerEndsAt]);

  if (!left) return null;

  const parts = [];
  if (left.days) parts.push(`${left.days.toLocaleString("bn-BD")} দিন`);
  if (left.hours) parts.push(`${left.hours.toLocaleString("bn-BD")} ঘণ্টা`);
  if (!left.days) parts.push(`${left.minutes.toLocaleString("bn-BD")} মিনিট`);

  return (
    <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-4 py-2 text-[13px] text-cream/85">
      <Clock size={14} className="text-amber shrink-0" />
      <span>
        অফার শেষ হতে বাকি <span className="font-display font-semibold text-cream">{parts.join(" ")}</span>
      </span>
    </div>
  );
}
