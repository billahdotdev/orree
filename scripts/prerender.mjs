/**
 * Writes a real static HTML file for every landing URL, and regenerates
 * sitemap.xml from the same campaign list.
 *
 * WHY THIS EXISTS
 *
 * Meta's link-preview crawler and Google's first pass do not execute
 * JavaScript. In a plain SPA build there is exactly one HTML file, so every
 * landing URL served the homepage's <title>, description and og:image. The
 * consequence for paid traffic is direct and expensive: an ad pointing at
 * /candy previewed the generic homepage card instead of the candy photo, and
 * every landing page told crawlers its canonical address was the homepage.
 *
 * Having a separate route per product is worthless if all of them identify as
 * the same page. This closes that gap: dist/candy/index.html is a genuine
 * static document with the candy title, the candy description, the candy
 * photo and a canonical of https://orree.bd/candy. Cloudflare Pages serves
 * static files before the SPA fallback in _redirects, so a direct hit or a
 * crawler gets the right document, and React then hydrates the same route.
 *
 * The app's JS bundle is unchanged, so there is no second copy of anything to
 * keep in sync — only the <head> differs per file, and it is generated from
 * the same siteData the app renders from.
 *
 * Run automatically by `npm run build` (vite build && node scripts/prerender.mjs).
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { campaigns, products, brand } from "../src/data/siteData.js";
import { resolveCampaign, normalizeSlug } from "../src/utils/campaigns.js";

const DIST = "dist";
const ORIGIN = String(brand.website || "https://orree.bd").replace(/\/$/, "");

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Replaces a tag's attribute value in the HTML shell, or leaves it alone. */
function setAttr(html, matcher, attr, value) {
  const re = new RegExp(`(<${matcher}[^>]*\\s${attr}=")([^"]*)(")`, "i");
  return re.test(html) ? html.replace(re, `$1${escapeHtml(value)}$3`) : html;
}

function buildPage(shell, { title, description, url, image }) {
  let html = shell;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setAttr(html, 'meta name="description"', "content", description);
  html = setAttr(html, 'link rel="canonical"', "href", url);
  html = setAttr(html, 'meta property="og:url"', "content", url);
  html = setAttr(html, 'meta property="og:title"', "content", title);
  html = setAttr(html, 'meta property="og:description"', "content", description);
  html = setAttr(html, 'meta name="twitter:title"', "content", title);
  html = setAttr(html, 'meta name="twitter:description"', "content", description);

  if (image) {
    html = setAttr(html, 'meta property="og:image"', "content", image);
    html = setAttr(html, 'meta property="og:image:alt"', "content", title);
    html = setAttr(html, 'meta name="twitter:image"', "content", image);
    // The homepage OG image is 1200x630. A square product photo would be
    // cropped to those declared dimensions by Meta, so drop the hints and let
    // it size the real file.
    html = html.replace(/\s*<meta property="og:image:(width|height)"[^>]*>/gi, "");
  }

  return html;
}

const shell = readFileSync(join(DIST, "index.html"), "utf8");

const active = (campaigns || []).filter((c) => c.active !== false && c.slug);
const urls = [{ loc: `${ORIGIN}/`, priority: "1.0" }];
let written = 0;

for (const campaign of active) {
  const resolved = resolveCampaign(campaign, products);
  if (!resolved) {
    console.warn(`prerender: skipping "${campaign.slug}" — no matching product`);
    continue;
  }

  const { product } = resolved;
  const slug = normalizeSlug(campaign.slug);
  const url = `${ORIGIN}/${slug}`;

  // Campaign photo wins, then the product's own, then the site OG card.
  const firstImage = (campaign.images || []).filter(Boolean)[0] || (product.images || [])[0] || null;
  const image = firstImage
    ? firstImage.startsWith("http")
      ? firstImage
      : `${ORIGIN}${firstImage}`
    : `${ORIGIN}/og-image.jpg`;

  const title = campaign.metaTitle || `${product.title} | Orree`;
  const description = campaign.metaDescription || product.shortDesc || "";

  const dir = join(DIST, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), buildPage(shell, { title, description, url, image }), "utf8");

  urls.push({ loc: url, priority: "0.9" });
  written++;
}

/**
 * Cache headers for the generated shells.
 *
 * public/_headers marks /index.html no-cache so a returning visitor never gets
 * an old document pointing at hashed asset filenames that no longer exist. The
 * prerendered landing pages are the same kind of document and need the same
 * rule — but their paths come from the campaign list, so hand-maintaining them
 * in _headers would silently rot the moment a slug changes. Generated here
 * instead, from the same source.
 */
const headersPath = join(DIST, "_headers");
if (existsSync(headersPath) && urls.length > 1) {
  const rules = urls
    .slice(1)
    .map((u) => `\n${new URL(u.loc).pathname}\n  Cache-Control: no-cache`)
    .join("");
  appendFileSync(headersPath, `\n\n# Prerendered landing shells — generated by scripts/prerender.mjs${rules}\n`, "utf8");
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap, "utf8");

console.log(`prerender: ${written} landing page(s) + sitemap (${urls.length} URLs)`);
for (const u of urls.slice(1)) console.log(`  → ${u.loc}`);
