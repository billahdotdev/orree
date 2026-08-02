import React from "react";
import { Truck } from "lucide-react";

/**
 * Delivery status in the cart.
 *
 * Two distinct modes, because the site now ships free everywhere:
 *
 *  1. ALL ZONES FREE → a flat confirmation badge. The old "spend ৳X more to
 *     unlock free delivery" progress bar becomes actively misleading here: it
 *     implies a charge the customer will never pay, and asks them to add items
 *     to escape a fee that does not exist. That reads as a manipulation the
 *     moment they reach the order summary and see ৳0, which is the opposite of
 *     what this component is for.
 *  2. A FEE EXISTS → the original threshold progress bar, unchanged.
 *
 * Both modes read from the same `shipping` object, so flipping between them is
 * a one-line data edit in siteData.js with no code change.
 */
export default function FreeShippingBar({ totalPrice, shipping }) {
  if (!shipping) return null;

  const fees = [shipping.insideDhaka, shipping.outsideDhaka, shipping.flatFee].filter(
    (n) => typeof n === "number"
  );
  const alwaysFree = fees.length > 0 && fees.every((n) => n === 0);

  if (alwaysFree) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-amber/25 bg-amber/[0.07] px-4 py-3 mb-4">
        <Truck size={15} className="text-amber shrink-0" aria-hidden="true" />
        <p className="text-[13px] leading-snug text-cream/85">
          <span className="font-medium text-amber">ডেলিভারি সম্পূর্ণ ফ্রি</span> — সারা বাংলাদেশে, যেকোনো
          অর্ডারে
        </p>
      </div>
    );
  }

  if (!shipping.freeThreshold) return null;

  const { freeThreshold } = shipping;
  const fromFee = fees.length ? Math.min(...fees.filter((n) => n > 0)) : null;
  const remaining = Math.max(0, freeThreshold - totalPrice);
  const progress = Math.min(100, Math.round((totalPrice / freeThreshold) * 100));
  const qualifies = remaining === 0;

  return (
    <div className="rounded-2xl bg-cream/5 border border-cream/10 px-4 py-3.5 mb-4">
      <p className="flex items-center gap-2 text-[13px] text-cream/75 mb-2.5">
        <Truck size={14} className="text-amber shrink-0" />
        {qualifies ? (
          <span>
            অভিনন্দন! আপনার অর্ডারে <span className="text-amber font-medium">ফ্রি ডেলিভারি</span> প্রযোজ্য 🎉
          </span>
        ) : (
          <span>
            আরও <span className="text-amber font-medium">৳{remaining.toLocaleString("bn-BD")}</span> কিনলেই ফ্রি
            ডেলিভারি পাবেন
          </span>
        )}
      </p>
      <div
        className="h-1.5 rounded-full bg-cream/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="ফ্রি ডেলিভারির অগ্রগতি"
      >
        <div className="h-full rounded-full bg-amber transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      {!qualifies && fromFee !== null && Number.isFinite(fromFee) && (
        <p className="text-cream/40 text-[11.5px] mt-2">
          ৳{freeThreshold.toLocaleString("bn-BD")}-এর কম অর্ডারে ডেলিভারি চার্জ ৳
          {fromFee.toLocaleString("bn-BD")} থেকে শুরু
        </p>
      )}
    </div>
  );
}
