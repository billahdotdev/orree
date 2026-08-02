import React from "react";
import { trackWhatsAppClick, trackMessengerClick } from "../tracker.js";
import { copyAndOpenMessenger } from "../services/messenger.js";
import { WhatsAppIcon, MessengerIcon, BRAND_COLORS } from "./BrandIcons.jsx";

const GENERAL_INQUIRY = "আসসালামু আলাইকুম, Orree সম্পর্কে জানতে চাই।";

/**
 * Floating chat buttons.
 *
 * Both were previously the same generic lucide speech bubble, and WhatsApp's
 * was painted in the site's amber. The result was two near-identical orange
 * and blue circles that told the visitor nothing about which app would open —
 * and amber is this site's *buy* colour, so the chat button was competing
 * visually with the order CTA for the most valuable pixel on a phone screen.
 *
 * Now each wears its own brand colour and mark. Recognition is instant, and
 * amber is handed back to the thing that makes money.
 */
export default function FloatingContactButtons({ brand }) {
  const handleWhatsApp = () => {
    trackWhatsAppClick("floating_button");
    window.open(
      `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(GENERAL_INQUIRY)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleMessenger = () => {
    trackMessengerClick("floating_button");
    copyAndOpenMessenger(GENERAL_INQUIRY, brand.messengerUsername);
  };

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleMessenger}
        aria-label="মেসেঞ্জারে চ্যাট করুন"
        className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-glass transition-transform duration-300 hover:scale-110 active:scale-95"
        style={{ backgroundColor: BRAND_COLORS.messenger }}
      >
        <MessengerIcon size={22} />
      </button>
      <button
        type="button"
        onClick={handleWhatsApp}
        aria-label="হোয়াটসঅ্যাপে চ্যাট করুন"
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-glass transition-transform duration-300 hover:scale-110 active:scale-95"
        style={{ backgroundColor: BRAND_COLORS.whatsapp }}
      >
        <WhatsAppIcon size={26} />
      </button>
    </div>
  );
}
