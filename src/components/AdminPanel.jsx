import React, { useState } from "react";
import {
  ArrowLeft,
  Save,
  LogOut,
  Check,
  AlertCircle,
  ImageIcon,
  Package,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import AdminLogin from "./AdminLogin.jsx";
import Field from "./admin/Field.jsx";
import CampaignsTab from "./admin/CampaignsTab.jsx";
import { saveProducts, saveCampaigns, saveSite, isBackendConfigured } from "../services/contentService.js";
import { getProductImages, imagesFromLines } from "../utils/productImages.js";
import { blankProduct } from "../data/siteData.js";

/**
 * No-code control panel. Four areas, all saved together:
 *   • Products   — add / edit / reorder / delete, prices, stock, images
 *   • Landing pages — Meta-ad offer pages at /lp/<slug>
 *   • Hero + Story  — the main site's headline and brand story
 *   • Delivery      — per-zone fees and the free-shipping threshold
 *
 * Edits update `pageData` immediately (live preview on the site), and become
 * permanent only when you press Save — which re-sends the password for
 * server-side verification and writes to the Google Sheet.
 */
export default function AdminPanel({ pageData, setPageData }) {
  const [password, setPassword] = useState(null);
  const [tab, setTab] = useState("products");
  const [saveState, setSaveState] = useState(null); // null | "saving" | "saved" | { error }

  if (!password) return <AdminLogin onSuccess={setPassword} />;

  const touched = () => setSaveState(null);

  // ── products ──────────────────────────────────────────────────────
  const updateProduct = (id, field, value) => {
    touched();
    setPageData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };

  const updateNumber = (id, field, value) => {
    updateProduct(id, field, value === "" ? null : Number(value) || 0);
  };

  const updateList = (id, field, value) => {
    updateProduct(id, field, value.split("\n").map((s) => s.trim()).filter(Boolean));
  };

  const updateImages = (id, value) => {
    touched();
    const { images, image } = imagesFromLines(value);
    setPageData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, images, image } : p)),
    }));
  };

  const addProduct = () => {
    touched();
    const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    setPageData((prev) => ({ ...prev, products: [...prev.products, { ...blankProduct, id }] }));
  };

  const removeProduct = (id) => {
    const p = pageData.products.find((x) => x.id === id);
    if (!window.confirm(`"${p?.title || "প্রোডাক্ট"}" মুছে ফেলবেন? এটি ফেরানো যাবে না।`)) return;
    touched();
    setPageData((prev) => ({ ...prev, products: prev.products.filter((x) => x.id !== id) }));
  };

  const moveProduct = (id, dir) => {
    touched();
    setPageData((prev) => {
      const arr = [...prev.products];
      const i = arr.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...prev, products: arr };
    });
  };

  // ── site content ──────────────────────────────────────────────────
  const updateShipping = (field, value) => {
    touched();
    setPageData((prev) => ({
      ...prev,
      brand: { ...prev.brand, shipping: { ...prev.brand.shipping, [field]: Number(value) || 0 } },
    }));
  };

  const updateHero = (field, value) => {
    touched();
    setPageData((prev) => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
  };

  const updateStory = (field, value) => {
    touched();
    setPageData((prev) => ({ ...prev, story: { ...prev.story, [field]: value } }));
  };

  const setCampaigns = (campaigns) => {
    touched();
    setPageData((prev) => ({ ...prev, campaigns }));
  };

  // ── save everything ───────────────────────────────────────────────
  const handleSave = async () => {
    setSaveState("saving");
    const site = {
      brand: pageData.brand,
      hero: pageData.hero,
      story: pageData.story,
      formData: pageData.formData,
      reviews: pageData.reviews,
    };
    const results = await Promise.all([
      saveProducts(pageData.products, password),
      saveCampaigns(pageData.campaigns || [], password),
      saveSite(site, password),
    ]);
    const failed = results.find((r) => !r.ok);
    if (failed) {
      setSaveState({ error: failed.message || "সেভ করা যায়নি" });
    } else {
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? null : s)), 3000);
    }
  };

  const TABS = [
    { id: "products", label: "প্রোডাক্ট" },
    { id: "campaigns", label: "ল্যান্ডিং পেজ" },
    { id: "hero", label: "হিরো ও গল্প" },
    { id: "shipping", label: "ডেলিভারি" },
  ];

  return (
    <div className="min-h-screen bg-green-deep text-cream font-body pb-28">
      <div className="container-orree py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-cream/60 hover:text-amber text-sm">
            <ArrowLeft size={16} /> সাইটে ফিরুন
          </Link>
          <button
            type="button"
            onClick={() => setPassword(null)}
            className="inline-flex items-center gap-2 text-cream/50 hover:text-amber text-sm"
          >
            <LogOut size={15} /> লগ আউট
          </button>
        </div>

        <h1 className="font-display font-bold text-2xl mb-2">অ্যাডমিন প্যানেল</h1>
        <p className="text-cream/55 text-[14px] mb-7">
          পরিবর্তন সাথে সাথে প্রিভিউ হয় — কিন্তু <span className="text-cream">সেভ করলে</span> তবেই সবার জন্য লাইভ হবে।
        </p>

        {!isBackendConfigured() && (
          <div className="flex gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-4 mb-7 text-[13.5px] leading-relaxed">
            <AlertCircle size={17} className="text-amber shrink-0 mt-0.5" />
            <p className="text-cream/80">
              ব্যাকএন্ড কনফিগার করা নেই, তাই সেভ কাজ করবে না। GitHub-এ{" "}
              <code className="text-amber">VITE_SHEETS_WEBHOOK_URL</code> সিক্রেটটি যোগ করুন (README দেখুন)।
            </p>
          </div>
        )}

        <div className="flex gap-2 mb-8 border-b border-cream/10 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id ? "border-amber text-amber" : "border-transparent text-cream/50 hover:text-cream/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "products" && (
          <div className="space-y-5">
            {pageData.products.map((p, idx) => (
              <div key={p.id} className="glass rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-cream/10">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveProduct(p.id, -1)}
                      disabled={idx === 0}
                      aria-label="উপরে তুলুন"
                      className="tap flex h-8 w-8 items-center justify-center rounded-lg text-cream/50 hover:text-amber disabled:opacity-25"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(p.id, 1)}
                      disabled={idx === pageData.products.length - 1}
                      aria-label="নিচে নামান"
                      className="tap flex h-8 w-8 items-center justify-center rounded-lg text-cream/50 hover:text-amber disabled:opacity-25"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <h3 className="font-display font-semibold text-cream ml-1.5">{p.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <span className={`text-[13px] ${p.inStock ? "text-cream/70" : "text-amber"}`}>
                        {p.inStock ? "স্টকে আছে" : "স্টক নেই"}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={p.inStock}
                        onClick={() => updateProduct(p.id, "inStock", !p.inStock)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          p.inStock ? "bg-amber" : "bg-cream/20"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream transition-transform ${
                            p.inStock ? "translate-x-[22px]" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeProduct(p.id)}
                      aria-label="প্রোডাক্ট মুছুন"
                      className="tap flex h-8 w-8 items-center justify-center rounded-lg text-cream/45 hover:text-amber"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="টাইটেল" value={p.title} onChange={(v) => updateProduct(p.id, "title", v)} />
                  <Field
                    label="ইংরেজি লেবেল (প্লেসহোল্ডারে বড় করে দেখায়)"
                    value={p.titleEn || ""}
                    onChange={(v) => updateProduct(p.id, "titleEn", v)}
                  />
                  <Field
                    label="ব্যাজ (খালি রাখলে দেখাবে না)"
                    value={p.badge || ""}
                    onChange={(v) => updateProduct(p.id, "badge", v || null)}
                  />
                  <Field label="ওজন / পরিমাণ" value={p.weight} onChange={(v) => updateProduct(p.id, "weight", v)} />
                  <Field label="দাম (৳)" value={p.price} onChange={(v) => updateNumber(p.id, "price", v)} type="number" />
                  <Field
                    label="আগের দাম (৳) — কাটা দাগ দেখাতে"
                    value={p.compareAtPrice ?? ""}
                    onChange={(v) => updateNumber(p.id, "compareAtPrice", v)}
                    type="number"
                  />
                  <Field
                    label="উপাদান"
                    value={p.ingredients}
                    onChange={(v) => updateProduct(p.id, "ingredients", v)}
                    full
                  />
                  <Field
                    label="সংক্ষিপ্ত বিবরণ"
                    value={p.shortDesc}
                    onChange={(v) => updateProduct(p.id, "shortDesc", v)}
                    textarea
                    full
                  />
                  <Field
                    label="উপকারিতা — প্রতি লাইনে একটি"
                    value={(p.benefits || []).join("\n")}
                    onChange={(v) => updateList(p.id, "benefits", v)}
                    textarea
                    rows={4}
                    full
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label="ছবির লিংক — প্রতি লাইনে একটি (প্রথমটি প্রধান ছবি)"
                      value={getProductImages(p).join("\n")}
                      onChange={(v) => updateImages(p.id, v)}
                      icon={ImageIcon}
                      textarea
                      rows={3}
                    />
                    <div className="mt-3 flex items-start gap-4">
                      <div className="flex gap-2 shrink-0">
                        {getProductImages(p).length ? (
                          getProductImages(p)
                            .slice(0, 4)
                            .map((src, i) => (
                              <div
                                key={`${src}-${i}`}
                                className="relative h-20 w-20 rounded-xl overflow-hidden bg-gradient-to-br from-green-soft to-green-deeper flex items-center justify-center"
                              >
                                <img
                                  src={src}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                {i === 0 && (
                                  <span className="absolute bottom-1 left-1 rounded bg-green-deep/80 px-1.5 py-0.5 text-[9.5px] text-cream/80">
                                    প্রধান
                                  </span>
                                )}
                              </div>
                            ))
                        ) : (
                          <div className="h-20 w-24 rounded-xl bg-gradient-to-br from-green-soft to-green-deeper flex items-center justify-center">
                            <Package size={22} className="text-cream/25" />
                          </div>
                        )}
                      </div>
                      <p className="text-cream/45 text-[12.5px] leading-relaxed">
                        একাধিক ছবি দিলে গ্যালারিতে সোয়াইপ করে দেখা যাবে। ছবি{" "}
                        <code className="text-cream/70">public/products/</code> ফোল্ডারে রেখে{" "}
                        <code className="text-cream/70">/products/নাম.webp</code> লিখুন, অথবা যেকোনো পাবলিক
                        URL দিন। ছবি না দিলে ব্র্যান্ডেড প্লেসহোল্ডার দেখাবে।
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addProduct}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-cream/20 py-4 text-[14px] text-cream/60 hover:border-amber/50 hover:text-amber transition-colors"
            >
              <Plus size={16} /> নতুন প্রোডাক্ট যোগ করুন
            </button>
          </div>
        )}

        {tab === "campaigns" && (
          <CampaignsTab
            campaigns={pageData.campaigns || []}
            products={pageData.products}
            onChange={setCampaigns}
          />
        )}

        {tab === "hero" && (
          <div className="max-w-2xl space-y-8">
            <div className="space-y-5">
              <h3 className="font-display font-semibold text-cream">হিরো সেকশন</h3>
              {["eyebrow", "headline", "subtext", "ctaPrimary", "ctaSecondary"].map((f) => (
                <Field
                  key={f}
                  label={heroLabels[f] || f}
                  value={pageData.hero[f]}
                  textarea={f === "headline" || f === "subtext"}
                  onChange={(v) => updateHero(f, v)}
                />
              ))}
            </div>
            <div className="space-y-5 border-t border-cream/10 pt-8">
              <h3 className="font-display font-semibold text-cream">আমাদের গল্প</h3>
              <Field label="উপরের লেবেল" value={pageData.story.eyebrow} onChange={(v) => updateStory("eyebrow", v)} />
              <Field label="শিরোনাম" value={pageData.story.title} onChange={(v) => updateStory("title", v)} textarea rows={2} />
              <Field label="মূল লেখা" value={pageData.story.body} onChange={(v) => updateStory("body", v)} textarea rows={4} />
              <Field label="উদ্ধৃতি (quote)" value={pageData.story.quote} onChange={(v) => updateStory("quote", v)} textarea rows={3} />
            </div>
          </div>
        )}

        {tab === "shipping" && (
          <div className="max-w-md space-y-5">
            <Field
              label="ঢাকার ভিতরে ডেলিভারি চার্জ (৳)"
              value={pageData.brand.shipping.insideDhaka ?? pageData.brand.shipping.flatFee ?? 0}
              onChange={(v) => updateShipping("insideDhaka", v)}
              type="number"
            />
            <Field
              label="ঢাকার বাইরে ডেলিভারি চার্জ (৳)"
              value={pageData.brand.shipping.outsideDhaka ?? pageData.brand.shipping.flatFee ?? 0}
              onChange={(v) => updateShipping("outsideDhaka", v)}
              type="number"
            />
            <Field
              label="ফ্রি ডেলিভারি থ্রেশহোল্ড (৳)"
              value={pageData.brand.shipping.freeThreshold}
              onChange={(v) => updateShipping("freeThreshold", v)}
              type="number"
            />
            <p className="text-cream/50 text-[13px] leading-relaxed">
              ⓘ থ্রেশহোল্ডের সমান বা বেশি অর্ডারে ডেলিভারি ফ্রি হবে — কার্টের প্রগ্রেস বার ও অর্ডার সামারি
              এখান থেকেই হিসাব করে। কাস্টমার চেকআউটে নিজের এলাকা বেছে নেয়, তাই ডেলিভারিম্যান দরজায় গিয়ে
              অন্য দাম চাইবে না — এতে অর্ডার বাতিল অনেক কমে।
            </p>
          </div>
        )}
      </div>

      {/* Sticky save bar — always reachable, states are explicit */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-cream/10 bg-green-deeper/95 backdrop-blur">
        <div className="container-orree pt-4 safe-bottom flex items-center justify-between gap-4">
          <p className="text-[13px] text-cream/60">
            {saveState === "saved" && <span className="text-amber">✓ সেভ হয়েছে — সাইটে লাইভ</span>}
            {saveState?.error && <span className="text-amber">{saveState.error}</span>}
            {!saveState && "সব পরিবর্তন একসাথে সেভ হয় — প্রোডাক্ট, ল্যান্ডিং পেজ, হিরো ও ডেলিভারি"}
            {saveState === "saving" && "সেভ করা হচ্ছে..."}
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === "saving"}
            className="btn-amber shrink-0 !py-3 disabled:opacity-60"
          >
            {saveState === "saved" ? <Check size={16} /> : <Save size={16} />}
            {saveState === "saving" ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

const heroLabels = {
  eyebrow: "উপরের ছোট লেবেল",
  headline: "মূল হেডলাইন",
  subtext: "সাব-টেক্সট",
  ctaPrimary: "প্রথম বাটন",
  ctaSecondary: "দ্বিতীয় বাটন",
};
