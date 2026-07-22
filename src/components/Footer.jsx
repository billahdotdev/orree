import React, { useState } from "react";
import { Phone, Mail, MapPin, Facebook, Instagram, Music2, Youtube, MessageCircle } from "lucide-react";
import logoUrl from "../assets/orree-logo.svg";
import { PrivacyPolicyModal, ReturnRefundModal } from "./PolicyModal.jsx";

const SOCIAL_LINKS = [
  { id: "facebook", label: "Facebook", icon: Facebook, href: "https://facebook.com/orree.bd" },
  { id: "instagram", label: "Instagram", icon: Instagram, href: "https://instagram.com/orree.bd" },
  { id: "tiktok", label: "TikTok", icon: Music2, href: "https://tiktok.com/@orree.bd" },
  { id: "youtube", label: "YouTube", icon: Youtube, href: "https://youtube.com/@orree.bd" },
];

export default function Footer({ brand }) {
  const year = new Date().getFullYear();
  const [openModal, setOpenModal] = useState(null); // null | "privacy" | "return"

  const phones = [
    { number: brand.phone, display: brand.phoneDisplay },
    { number: brand.phoneAlt, display: brand.phoneAlt.replace(/(\d{5})(\d+)/, "$1-$2") },
  ];

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brand.address)}`;

  return (
    <footer id="contact" className="relative bg-green-deeper border-t border-cream/10 pt-16 pb-8 scroll-mt-20">
      <div className="container-orree">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <img src={logoUrl} alt="Orree" className="h-8 w-auto mb-4" />
            <p className="text-cream/60 text-[14.5px] leading-relaxed max-w-xs">
              শিকড়ের স্বাদ, যত্নে বানানো। আপনি যেই খাবার ভালোবাসেন, তার প্রাপ্য আপনি।
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-cream mb-4 text-[15px]">যোগাযোগ</h4>
            <ul className="space-y-3 text-[14px] text-cream/65">
              {phones.map((p) => (
                <li key={p.number}>
                  <a
                    href={`tel:${p.number}`}
                    className="inline-flex items-center gap-2.5 hover:text-amber transition-colors"
                  >
                    <Phone size={15} className="text-amber shrink-0" />
                    {p.display}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`https://wa.me/${brand.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-amber transition-colors"
                >
                  <MessageCircle size={15} className="text-amber shrink-0" />
                  হোয়াটসঅ্যাপে মেসেজ করুন
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${brand.email}`}
                  className="inline-flex items-center gap-2.5 hover:text-amber transition-colors"
                >
                  <Mail size={15} className="text-amber shrink-0" />
                  {brand.email}
                </a>
              </li>
              <li>
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2.5 hover:text-amber transition-colors"
                >
                  <MapPin size={15} className="text-amber shrink-0 mt-0.5" />
                  <span>{brand.address}</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-cream mb-4 text-[15px]">সোশ্যাল</h4>
            <div className="flex flex-wrap items-center gap-3">
              {SOCIAL_LINKS.map(({ id, label, icon: Icon, href }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full glass hover:border-amber/50 hover:text-amber transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <p className="text-cream/45 text-[13px] mt-4">{brand.social}</p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-cream mb-4 text-[15px]">পলিসি</h4>
            <ul className="space-y-3 text-[14px] text-cream/65">
              <li>
                <button type="button" onClick={() => setOpenModal("privacy")} className="hover:text-amber transition-colors text-left">
                  প্রাইভেসি পলিসি
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setOpenModal("return")} className="hover:text-amber transition-colors text-left">
                  রিটার্ন ও রিফান্ড পলিসি
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-cream/40 text-[12.5px]">
          <p>© {year} Orree | ওরি — সর্বস্বত্ব সংরক্ষিত।</p>
          <p>Made with ❤ in Bangladesh</p>
        </div>
      </div>

      {openModal === "privacy" && <PrivacyPolicyModal brand={brand} onClose={() => setOpenModal(null)} />}
      {openModal === "return" && <ReturnRefundModal brand={brand} onClose={() => setOpenModal(null)} />}
    </footer>
  );
}
