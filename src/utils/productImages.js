/**
 * One place that answers "which images does this product have?".
 *
 * Products used to carry a single `image: string`. They now carry
 * `images: string[]`, but the old field is still honoured — anything saved
 * from an older /admin session, or an older row still sitting in the Google
 * Sheet, keeps rendering exactly as before. Never read `product.image`
 * directly in a component; go through here so the fallback stays in one file.
 */

export function getProductImages(product) {
  if (!product) return [];

  const list = Array.isArray(product.images) ? product.images : [];
  const cleaned = list
    .map((src) => (typeof src === "string" ? src.trim() : ""))
    .filter(Boolean);

  if (cleaned.length) return cleaned;

  const single = typeof product.image === "string" ? product.image.trim() : "";
  return single ? [single] : [];
}

/** First image — what the card, the OG-ish previews and the cart thumbnail use. */
export function getPrimaryImage(product) {
  return getProductImages(product)[0] || null;
}

/**
 * Turns the admin panel's one-per-line textarea into the shape products are
 * stored in. `image` is kept in sync with the first entry so that any older
 * consumer (or a rollback to an older build) still finds a valid photo.
 */
export function imagesFromLines(text) {
  const images = String(text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return { images, image: images[0] || null };
}
