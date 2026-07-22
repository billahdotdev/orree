import React from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";

/**
 * Mobile-only sticky CTA — keeps the order action one thumb-reach away no
 * matter how far the user has scrolled. Hidden on sm+ since the header cart
 * icon already serves that role on larger screens.
 */
export default function StickyOrderBar() {
  const { items, totalCount, totalPrice, openOrderForm } = useCart();

  const scrollToProducts = () => {
    document.querySelector("#products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-2">
      <button
        type="button"
        onClick={items.length > 0 ? openOrderForm : scrollToProducts}
        className="w-full flex items-center justify-between gap-3 rounded-full bg-amber pl-5 pr-2 py-2 shadow-amber-glow"
      >
        <span className="flex items-center gap-2 font-display font-semibold text-cream text-[14.5px]">
          <ShoppingBag size={17} />
          {items.length > 0 ? `৳${totalPrice.toLocaleString("bn-BD")} — অর্ডার সম্পন্ন করুন` : "এখনই অর্ডার করুন"}
        </span>
        {totalCount > 0 && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-amber-deep text-[13px] font-bold shrink-0">
            {totalCount}
          </span>
        )}
      </button>
    </div>
  );
}
