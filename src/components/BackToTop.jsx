import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="উপরে ফিরুন"
      className={`fixed left-4 sm:left-6 bottom-24 sm:bottom-6 z-40 flex h-11 w-11 items-center justify-center rounded-full glass text-cream/80 hover:text-amber hover:border-amber/40 transition-all duration-300 active:scale-90 ${
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"
      }`}
    >
      <ArrowUp size={18} />
    </button>
  );
}
