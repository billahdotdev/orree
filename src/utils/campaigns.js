/**
 * Campaign helpers — one place that answers "what does this offer page show?".
 *
 * A campaign is a thin set of overrides on top of a base product. Any field
 * left blank falls back to the product's own value, so a campaign can be a
 * one-field tweak ("same candy, new headline") or a full offer (new price,
 * new photos, new copy, a real deadline). Components should always render the
 * object returned by `resolveCampaign()`, never a raw campaign, so the
 * fallback logic lives here and nowhere else.
 */

import { getProductImages } from "./productImages.js";

const isFilled = (v) => v !== null && v !== undefined && v !== "";

export function normalizeSlug(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^\u0980-\u09ffa-z0-9\s-]/g, "") // allow Bengali, latin, digits, space, hyphen
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Finds an active campaign by slug (case/space-insensitive). */
export function findCampaignBySlug(campaigns, slug) {
  const target = normalizeSlug(slug);
  return (campaigns || []).find((c) => c.active !== false && normalizeSlug(c.slug) === target) || null;
}

/**
 * Merges a campaign onto its base product and returns everything a landing
 * page needs: `{ product, campaign, offerEndsAt, source }`. `product` is a
 * real product object with overrides applied, safe to hand to the cart,
 * tracker and order flow unchanged.
 */
export function resolveCampaign(campaign, products) {
  if (!campaign) return null;
  const base = (products || []).find((p) => p.id === campaign.productId) || (products || [])[0];
  if (!base) return null;

  const overrideImages = getProductImages({ images: campaign.images, image: null });
  const overrideBenefits = Array.isArray(campaign.benefits) ? campaign.benefits.filter(Boolean) : [];

  const product = {
    ...base,
    // Offer pricing wins when set; otherwise the product's own price stands.
    price: isFilled(campaign.price) ? Number(campaign.price) : base.price,
    compareAtPrice: isFilled(campaign.compareAtPrice) ? Number(campaign.compareAtPrice) : base.compareAtPrice,
    title: isFilled(campaign.headline) ? campaign.headline : base.title,
    shortDesc: isFilled(campaign.subheadline) ? campaign.subheadline : base.shortDesc,
    badge: isFilled(campaign.badge) ? campaign.badge : base.badge,
    images: overrideImages.length ? overrideImages : getProductImages(base),
    benefits: overrideBenefits.length ? overrideBenefits : base.benefits,
  };
  // Keep legacy single-image consumers correct too.
  product.image = getProductImages(product)[0] || null;

  return {
    // The one true URL for this offer. Every ad, every canonical tag, every
    // sitemap entry and the prerenderer all read this single value, so a slug
    // change can never leave them disagreeing.
    canonicalPath: `/${normalizeSlug(campaign.slug)}`,
    product,
    baseProduct: base,
    campaign,
    eyebrow: isFilled(campaign.eyebrow) ? campaign.eyebrow : "",
    ctaText: isFilled(campaign.ctaText) ? campaign.ctaText : "এখনই অর্ডার করুন",
    offerEndsAt: isFilled(campaign.offerEndsAt) ? campaign.offerEndsAt : null,
    showReviews: campaign.showReviews !== false,
    source: isFilled(campaign.source) ? campaign.source : `lp-${normalizeSlug(campaign.slug)}`,
    metaTitle: isFilled(campaign.metaTitle) ? campaign.metaTitle : product.title,
    metaDescription: isFilled(campaign.metaDescription) ? campaign.metaDescription : product.shortDesc,
  };
}

/**
 * How much time is left on an honest offer deadline.
 * Returns null when there's no deadline or it has already passed — we never
 * show a fake or expired countdown.
 */
export function offerTimeLeft(offerEndsAt, now = Date.now()) {
  if (!offerEndsAt) return null;
  const end = new Date(offerEndsAt).getTime();
  if (!Number.isFinite(end)) return null;
  const ms = end - now;
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  return {
    ms,
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}
