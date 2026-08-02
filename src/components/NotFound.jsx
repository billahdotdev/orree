import React from "react";
import { Link } from "react-router-dom";
import logoUrl from "../assets/orree-logo.svg";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-green-deep text-cream flex flex-col items-center justify-center px-6 text-center">
      <img src={logoUrl} alt="Orree" className="h-9 w-auto mb-8 opacity-80" />
      <p className="font-display font-extrabold text-6xl text-cream/15 mb-4">৪০৪</p>
      <h1 className="font-display font-bold text-2xl mb-3">এই পথটা আমাদের চেনা নয়</h1>
      <p className="text-cream/60 max-w-sm mb-8 leading-relaxed">
        মনে হচ্ছে পেজটা হয় সরে গেছে, নয়তো লিংকে কোনো ভুল আছে। চলুন, ফিরে যাই মূল পাতায়।
      </p>
      <Link to="/" className="btn-amber">
        হোমপেজে ফিরুন
      </Link>
    </div>
  );
}
