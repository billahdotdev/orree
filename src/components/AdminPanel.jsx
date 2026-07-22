import React, { useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * A minimal no-code control panel: lets an Orree admin tweak hero copy and
 * product titles/prices/descriptions without touching any code.
 * `pageData` + `setPageData` are lifted state from App.jsx, so any change
 * here is reflected live on the main site immediately.
 *
 * NOTE: this is intentionally client-side only (no auth, no persistence
 * beyond the session) — wire it to your CMS/API of choice before shipping
 * this route publicly. It's already excluded from indexing via robots.txt.
 */
export default function AdminPanel({ pageData, setPageData }) {
  const [tab, setTab] = useState("hero");

  const updateHero = (field, value) => {
    setPageData((prev) => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
  };

  const updateProduct = (id, field, value) => {
    setPageData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id ? { ...p, [field]: field === "price" || field === "compareAtPrice" ? Number(value) || 0 : value } : p
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-green-deep text-cream">
      <div className="container-orree py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-cream/60 hover:text-amber text-sm">
            <ArrowLeft size={16} /> সাইটে ফিরুন
          </Link>
          <span className="inline-flex items-center gap-2 text-amber text-sm font-medium">
            <Save size={15} /> লাইভ — সব পরিবর্তন সঙ্গে সঙ্গে সাইটে প্রতিফলিত হয়
          </span>
        </div>

        <h1 className="font-display font-bold text-2xl mb-6">অ্যাডমিন প্যানেল</h1>

        <div className="flex gap-2 mb-8 border-b border-cream/10">
          {[
            { id: "hero", label: "হিরো সেকশন" },
            { id: "products", label: "প্রোডাক্ট" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-amber text-amber" : "border-transparent text-cream/50 hover:text-cream/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "hero" && (
          <div className="max-w-xl space-y-5">
            <Field label="Eyebrow টেক্সট" value={pageData.hero.eyebrow} onChange={(v) => updateHero("eyebrow", v)} />
            <Field label="হেডলাইন" value={pageData.hero.headline} onChange={(v) => updateHero("headline", v)} textarea />
            <Field label="সাবটেক্সট" value={pageData.hero.subtext} onChange={(v) => updateHero("subtext", v)} textarea />
            <Field label="প্রাইমারি বাটন" value={pageData.hero.ctaPrimary} onChange={(v) => updateHero("ctaPrimary", v)} />
            <Field label="সেকেন্ডারি বাটন" value={pageData.hero.ctaSecondary} onChange={(v) => updateHero("ctaSecondary", v)} />
          </div>
        )}

        {tab === "products" && (
          <div className="space-y-6">
            {pageData.products.map((p) => (
              <div key={p.id} className="glass rounded-2xl p-6 grid gap-4 sm:grid-cols-2">
                <Field label="টাইটেল" value={p.title} onChange={(v) => updateProduct(p.id, "title", v)} />
                <Field label="দাম (৳)" value={p.price} onChange={(v) => updateProduct(p.id, "price", v)} type="number" />
                <Field
                  label="সংক্ষিপ্ত বিবরণ"
                  value={p.shortDesc}
                  onChange={(v) => updateProduct(p.id, "shortDesc", v)}
                  textarea
                  full
                />
                <Field label="স্টক" value={p.inStock ? "আছে" : "নেই"} onChange={() => {}} disabled />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, disabled, full, type = "text" }) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-[13px] text-cream/60 mb-1.5">{label}</span>
      <Comp
        type={textarea ? undefined : type}
        inputMode={type === "number" ? "numeric" : undefined}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={textarea ? 3 : undefined}
        className="w-full rounded-xl bg-cream/5 border border-cream/15 px-4 py-2.5 text-cream placeholder:text-cream/30 focus:border-amber outline-none transition-colors disabled:opacity-50"
      />
    </label>
  );
}
