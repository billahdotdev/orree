import React, { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Link2,
  Megaphone,
  ChevronDown,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import Field from "./Field.jsx";
import { normalizeSlug, resolveCampaign } from "../../utils/campaigns.js";
import { getProductImages, imagesFromLines } from "../../utils/productImages.js";
import { blankCampaign } from "../../data/siteData.js";

/**
 * Landing-page (campaign) manager — the heart of running Meta ad offers.
 *
 * Every card here is a live page at /lp/<slug>. Create one, point a Meta ad
 * at its URL, and retire it with the visibility toggle when the offer ends —
 * all without touching code or redeploying. Blank fields inherit the base
 * product's values, so a campaign can be a one-line tweak or a full offer.
 */

function makeId() {
  return `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Absolute URL for an offer page, honouring the /orree/ base path on Pages. */
function campaignUrl(slug) {
  const base = import.meta.env.BASE_URL || "/";
  const path = `${base}lp/${slug}`.replace(/\/{2,}/g, "/");
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CampaignsTab({ campaigns, products, onChange }) {
  const [openId, setOpenId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const usedSlugs = useMemo(
    () => campaigns.map((c) => normalizeSlug(c.slug)).filter(Boolean),
    [campaigns]
  );

  const update = (id, patch) => onChange(campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addCampaign = () => {
    const id = makeId();
    const firstProduct = products[0]?.id || "";
    onChange([...campaigns, { ...blankCampaign, id, productId: firstProduct }]);
    setOpenId(id);
  };

  const duplicateCampaign = (c) => {
    const id = makeId();
    const copy = { ...c, id, slug: normalizeSlug(c.slug) ? `${normalizeSlug(c.slug)}-copy` : "", active: false };
    const idx = campaigns.findIndex((x) => x.id === c.id);
    const next = [...campaigns];
    next.splice(idx + 1, 0, copy);
    onChange(next);
    setOpenId(id);
  };

  const removeCampaign = (id) => onChange(campaigns.filter((c) => c.id !== id));

  const copyUrl = async (slug, id) => {
    try {
      await navigator.clipboard.writeText(campaignUrl(slug));
      setCopiedId(id);
      setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 2000);
    } catch {
      /* clipboard blocked — the link is still visible to copy by hand */
    }
  };

  const slugError = (c) => {
    const s = normalizeSlug(c.slug);
    if (!s) return "একটি লিংক-নাম (slug) দিন";
    if (["admin", "lp", "candy", "moshla"].includes(s) && c.id !== findSeed(campaigns, s)) {
      // candy/moshla are allowed only for their seeded campaigns
      if (s === "admin" || s === "lp") return "এই নামটি সংরক্ষিত — অন্য নাম দিন";
    }
    if (usedSlugs.filter((x) => x === s).length > 1) return "এই slug আরেকটি পেজে ব্যবহৃত হয়েছে";
    return "";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-cream/10 bg-cream/[0.03] p-4">
        <Megaphone size={18} className="text-amber shrink-0 mt-0.5" />
        <p className="text-cream/70 text-[13.5px] leading-relaxed">
          প্রতিটি কার্ড একটি আলাদা ল্যান্ডিং পেজ — ঠিকানা{" "}
          <code className="text-cream/85">/lp/আপনার-slug</code>। নতুন অফার লঞ্চ করতে একটা পেজ বানান, তার
          লিংকটা কপি করে মেটা এডে বসান। অফার শেষ হলে <span className="text-cream">দৃশ্যমানতা</span> বন্ধ করে
          দিন — লিংকটা তখন নিষ্ক্রিয় হয়ে যাবে। খালি ঘরগুলো প্রোডাক্টের নিজের তথ্য থেকে পূরণ হবে।
        </p>
      </div>

      {campaigns.length === 0 && (
        <div className="rounded-2xl glass p-8 text-center">
          <p className="text-cream/60 text-[14px] mb-4">এখনো কোনো ল্যান্ডিং পেজ নেই।</p>
          <button type="button" onClick={addCampaign} className="btn-amber mx-auto">
            <Plus size={16} /> প্রথম পেজ বানান
          </button>
        </div>
      )}

      {campaigns.map((c) => {
        const slug = normalizeSlug(c.slug);
        const base = products.find((p) => p.id === c.productId);
        const resolved = base ? resolveCampaign({ ...c, active: true }, products) : null;
        const isOpen = openId === c.id;
        const err = slugError(c);

        return (
          <div key={c.id} className="rounded-2xl glass overflow-hidden">
            {/* header row */}
            <div className="flex items-center gap-3 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => update(c.id, { active: !(c.active !== false) })}
                role="switch"
                aria-checked={c.active !== false}
                aria-label="দৃশ্যমানতা"
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  c.active !== false ? "bg-amber" : "bg-cream/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream transition-transform ${
                    c.active !== false ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : c.id)}
                className="flex flex-1 items-center gap-3 min-w-0 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-cream font-display font-semibold text-[15px] truncate">
                    {c.headline || base?.title || "নামহীন অফার"}
                  </p>
                  <p className="text-cream/45 text-[12.5px] truncate">
                    /lp/{slug || "…"}
                    {c.active === false && <span className="text-amber"> · নিষ্ক্রিয়</span>}
                  </p>
                </div>
                <ChevronDown
                  size={17}
                  className={`text-cream/40 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={campaignUrl(slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="প্রিভিউ"
                  className={`tap flex h-9 w-9 items-center justify-center rounded-full text-cream/60 hover:text-amber ${
                    slug ? "" : "pointer-events-none opacity-30"
                  }`}
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => duplicateCampaign(c)}
                  aria-label="নকল করুন"
                  className="tap flex h-9 w-9 items-center justify-center rounded-full text-cream/60 hover:text-amber"
                >
                  <Copy size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => removeCampaign(c.id)}
                  aria-label="মুছুন"
                  className="tap flex h-9 w-9 items-center justify-center rounded-full text-cream/50 hover:text-amber"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* editor body */}
            {isOpen && (
              <div className="border-t border-cream/10 p-4 sm:p-6 space-y-5">
                {/* URL + copy */}
                <div className="rounded-xl border border-cream/10 bg-green-deeper/40 p-3.5">
                  <div className="flex items-center gap-2 text-[13px] text-cream/70 mb-2">
                    <Link2 size={14} className="text-amber" /> এই পেজের লিংক (মেটা এডে বসান)
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 min-w-0 truncate rounded-lg bg-cream/5 px-3 py-2 text-[12.5px] text-cream/80">
                      {campaignUrl(slug || "your-slug")}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyUrl(slug, c.id)}
                      disabled={!slug}
                      className="tap flex items-center gap-1.5 rounded-lg border border-cream/15 px-3 py-2 text-[12.5px] text-cream/75 hover:text-amber disabled:opacity-40"
                    >
                      {copiedId === c.id ? <Check size={13} /> : <Copy size={13} />}
                      {copiedId === c.id ? "কপি হয়েছে" : "কপি"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="লিংক-নাম (slug)"
                    value={c.slug}
                    onChange={(v) => update(c.id, { slug: v })}
                    placeholder="যেমন: eid-offer"
                    hint={err ? "" : "শুধু ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন ভালো"}
                  />
                  <label className="block">
                    <span className="text-[13px] text-cream/60 mb-1.5 block">কোন প্রোডাক্ট</span>
                    <div className="relative">
                      <select
                        value={c.productId}
                        onChange={(e) => update(c.id, { productId: e.target.value })}
                        className="w-full appearance-none rounded-xl bg-cream/5 border border-cream/15 px-4 py-2.5 text-cream focus:border-amber outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id} className="bg-green-deep">
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/40" />
                    </div>
                  </label>
                </div>
                {err && <p className="text-amber text-[12.5px] -mt-1">{err}</p>}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="হেডলাইন (খালি = প্রোডাক্টের নাম)"
                    value={c.headline}
                    onChange={(v) => update(c.id, { headline: v })}
                    placeholder={base?.title || ""}
                    full
                  />
                  <Field
                    label="সাব-হেডলাইন / বিবরণ (খালি = প্রোডাক্টের বিবরণ)"
                    value={c.subheadline}
                    onChange={(v) => update(c.id, { subheadline: v })}
                    placeholder={base?.shortDesc || ""}
                    textarea
                    rows={2}
                    full
                  />
                  <Field
                    label="উপরের ছোট লেবেল (eyebrow)"
                    value={c.eyebrow}
                    onChange={(v) => update(c.id, { eyebrow: v })}
                    placeholder="যেমন: ঈদ স্পেশাল অফার"
                  />
                  <Field
                    label="ব্যাজ"
                    value={c.badge}
                    onChange={(v) => update(c.id, { badge: v })}
                    placeholder={base?.badge || "যেমন: সীমিত অফার"}
                  />
                  <Field
                    label="অফার মূল্য ৳ (খালি = প্রোডাক্টের দাম)"
                    value={c.price ?? ""}
                    onChange={(v) => update(c.id, { price: v === "" ? null : Number(v) || 0 })}
                    type="number"
                    placeholder={String(base?.price ?? "")}
                  />
                  <Field
                    label="আগের দাম ৳ (কাটা দাগ দেখাতে)"
                    value={c.compareAtPrice ?? ""}
                    onChange={(v) => update(c.id, { compareAtPrice: v === "" ? null : Number(v) || 0 })}
                    type="number"
                    placeholder={String(base?.compareAtPrice ?? "")}
                  />
                  <Field
                    label="বাটনের লেখা"
                    value={c.ctaText}
                    onChange={(v) => update(c.id, { ctaText: v })}
                    placeholder="এখনই অর্ডার করুন"
                  />
                  <label className="block">
                    <span className="text-[13px] text-cream/60 mb-1.5 block">অফার শেষ হওয়ার সময় (ঐচ্ছিক)</span>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocal(c.offerEndsAt)}
                      onChange={(e) =>
                        update(c.id, { offerEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null })
                      }
                      className="w-full rounded-xl bg-cream/5 border border-cream/15 px-4 py-2.5 text-cream focus:border-amber outline-none [color-scheme:dark]"
                    />
                    <span className="mt-1 block text-[12px] text-cream/40 leading-relaxed">
                      দিলে একটি সৎ কাউন্টডাউন দেখাবে — সময় পেরোলে নিজেই মিলিয়ে যাবে। ভুয়া তাড়াহুড়ো নয়।
                    </span>
                  </label>
                </div>

                {/* images override */}
                <div>
                  <Field
                    label="ছবি — প্রতি লাইনে একটি (খালি = প্রোডাক্টের ছবি)"
                    value={getProductImages({ images: c.images }).join("\n")}
                    onChange={(v) => update(c.id, { images: imagesFromLines(v).images })}
                    textarea
                    rows={2}
                  />
                  <div className="mt-2.5 flex gap-2">
                    {(getProductImages({ images: c.images }).length
                      ? getProductImages({ images: c.images })
                      : getProductImages(base || {})
                    )
                      .slice(0, 4)
                      .map((src, i) => (
                        <div key={`${src}-${i}`} className="h-16 w-16 overflow-hidden rounded-lg bg-gradient-to-br from-green-soft to-green-deeper">
                          <img
                            src={src}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                  </div>
                </div>

                {/* misc toggles + meta */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => update(c.id, { showReviews: !(c.showReviews !== false) })}
                    className="flex items-center justify-between rounded-xl border border-cream/15 px-4 py-2.5 text-[13.5px] text-cream/75 hover:border-cream/30"
                  >
                    <span className="flex items-center gap-2">
                      {c.showReviews !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                      কাস্টমার রিভিউ দেখাবে
                    </span>
                    <span className={c.showReviews !== false ? "text-amber" : "text-cream/40"}>
                      {c.showReviews !== false ? "হ্যাঁ" : "না"}
                    </span>
                  </button>
                  <Field
                    label="ট্র্যাকিং সোর্স লেবেল (অর্ডারে যাবে)"
                    value={c.source}
                    onChange={(v) => update(c.id, { source: v })}
                    placeholder={`lp-${slug || "slug"}`}
                    hint="মেটা এডের অ্যাট্রিবিউশন — প্রতিটি অফারের জন্য আলাদা রাখুন"
                  />
                  <Field
                    label="ব্রাউজার-ট্যাব টাইটেল (ঐচ্ছিক)"
                    value={c.metaTitle}
                    onChange={(v) => update(c.id, { metaTitle: v })}
                    placeholder={resolved?.metaTitle || base?.title || ""}
                    full
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {campaigns.length > 0 && (
        <button
          type="button"
          onClick={addCampaign}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-cream/20 py-4 text-[14px] text-cream/60 hover:border-amber/50 hover:text-amber transition-colors"
        >
          <Plus size={16} /> নতুন ল্যান্ডিং পেজ যোগ করুন
        </button>
      )}
    </div>
  );
}

/** candy/moshla seeds may legitimately keep their reserved slug. */
function findSeed(campaigns, slug) {
  const match = campaigns.find((c) => normalizeSlug(c.slug) === slug);
  return match ? match.id : null;
}
