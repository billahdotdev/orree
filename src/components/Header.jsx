import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag } from "lucide-react";
import logoUrl from "../assets/orree-logo.svg";
import { useCart } from "../context/CartContext.jsx";

const NAV_LINKS = [
  { href: "#story", label: "আমাদের গল্প" },
  { href: "#products", label: "প্রোডাক্ট" },
  { href: "#reviews", label: "যা বলছেন সবাই" },
  { href: "#faq", label: "প্রশ্নোত্তর" },
  { href: "#contact", label: "যোগাযোগ" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { totalCount, openOrderForm } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: highlight whichever nav section is currently in view.
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.querySelector(l.href)).filter(Boolean);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(`#${visible[0].target.id}`);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2.5" : "py-4 sm:py-6"
      }`}
    >
      <div className="container-orree">
        <div
          className={`flex items-center justify-between rounded-full px-4 sm:px-6 transition-all duration-500 ${
            scrolled ? "glass shadow-glass py-2" : "py-2 bg-transparent border border-transparent"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Orree হোমপেজ">
            <img src={logoUrl} alt="Orree" className="h-7 sm:h-8 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                aria-current={activeSection === link.href ? "true" : undefined}
                className={`text-[15px] transition-colors duration-200 ${
                  activeSection === link.href ? "text-amber font-medium" : "text-cream/80 hover:text-amber"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={openOrderForm}
              aria-label="কার্ট দেখুন"
              className="relative flex items-center justify-center h-10 w-10 rounded-full glass hover:border-amber/50 transition-colors duration-200"
            >
              <ShoppingBag size={18} className="text-cream" />
              {totalCount > 0 && (
                <span
                  aria-live="polite"
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 w-5 rounded-full bg-amber text-[11px] font-semibold text-cream"
                >
                  {totalCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
              className="md:hidden flex items-center justify-center h-10 w-10 rounded-full glass"
            >
              {menuOpen ? <X size={18} className="text-cream" /> : <Menu size={18} className="text-cream" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? "max-h-72 mt-2 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="glass rounded-3xl px-6 py-5 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-base text-cream/85 hover:text-amber transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
