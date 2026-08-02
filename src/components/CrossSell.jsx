import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { getPrimaryImage } from "../utils/productImages.js";
import ProductThumb from "./ProductThumb.jsx";
import { trackCrossSellDismiss } from "../tracker.js";

/**
 * One add-on suggestion inside the checkout sheet.
 *
 * The dismiss control matters more than it looks. Without it the suggestion is
 * a fixed obstacle between the cart and the form — the customer cannot make it
 * go away, so on a small screen it just sits there as friction during the one
 * flow you least want to disturb. A shop that takes "no thanks" for an answer
 * feels like a shop, not a funnel.
 *
 * Dismissing advances to the NEXT eligible product rather than hiding the slot
 * entirely, so a "not that one" doesn't cost you the chance to offer something
 * they might actually want. When the list runs out, the slot disappears for
 * good — no nagging.
 *
 * State is per-session on purpose. Persisting refusals would mean a product
 * silently never being offered again months later, which is a lot of hidden
 * behaviour to carry for very little gain.
 */
export default function CrossSell({ products, cartItems, onAdd }) {
  const [dismissed, setDismissed] = useState([]);

  const cartIds = new Set(cartItems.map((i) => i.id));
  const suggestion = products.find(
    (p) => p.inStock && !cartIds.has(p.id) && !dismissed.includes(p.id)
  );

  if (!suggestion) return null;

  const handleDismiss = () => {
    trackCrossSellDismiss(suggestion.id);
    setDismissed((prev) => [...prev, suggestion.id]);
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl glass p-3 mb-4">
      <ProductThumb src={getPrimaryImage(suggestion)} title={suggestion.title} size={52} />

      <div className="flex-1 min-w-0">
        <p className="text-cream/50 text-[11.5px] mb-0.5">সাথে যোগ করে দেখুন</p>
        <p className="text-cream text-[14px] font-medium truncate">{suggestion.title}</p>
        <p className="text-cream/50 text-[12.5px]">
          {suggestion.currency}
          {suggestion.price.toLocaleString("bn-BD")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onAdd(suggestion)}
          aria-label={`${suggestion.title} কার্টে যোগ করুন`}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber/40 text-amber px-3.5 py-2 text-[13px] font-medium hover:bg-amber/10 transition-colors"
        >
          <Plus size={14} />
          যোগ করুন
        </button>
        {/* Quieter than the add button by design — visible enough to find,
            never competing with the action that earns money. */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={`${suggestion.title} সাজেশন বাদ দিন`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-cream/35 transition-colors hover:text-cream/70 active:scale-95"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
