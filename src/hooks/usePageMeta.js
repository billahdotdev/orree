import { useEffect } from "react";

const DEFAULT_TITLE = "Orree | ওরি — প্রকৃতির আভিজাত্য আপনার প্রাপ্য";
const DEFAULT_DESCRIPTION =
  "চুইঝাল ক্যান্ডি, চুইঝাল মিছরি মসলা আর খেজুর বীজের কফি — শিকড়ের স্বাদ, যত্নে বানানো।";
const SITE_ORIGIN = "https://orree.bd";

function setTag(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Per-route title, description and CANONICAL URL.
 *
 * The canonical was the important gap. index.html ships a hard-coded
 * `<link rel="canonical" href="https://orree.bd/">`, and since an SPA never
 * reloads that file, every landing page was telling Google and Meta's crawler
 * "the real address of this page is the homepage." That points ad-link
 * previews and every SEO signal at the wrong URL — precisely the opposite of
 * having one landing page per product.
 *
 * og:url is updated alongside it for the same reason.
 *
 * Note the honest limitation: crawlers that don't execute JavaScript still see
 * index.html's static tags. That is why `scripts/prerender.mjs` writes a real
 * static HTML shell per landing route at build time — this hook keeps things
 * correct for in-app navigation, the prerender handles first paint and
 * crawlers.
 */
export default function usePageMeta(title, description, path) {
  useEffect(() => {
    document.title = title ? `${title} | Orree` : DEFAULT_TITLE;

    const desc = setTag('meta[name="description"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      return m;
    });
    const canonical = setTag('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      return l;
    });
    const ogUrl = setTag('meta[property="og:url"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:url");
      return m;
    });

    const prevDesc = desc.getAttribute("content");
    const prevCanonical = canonical.getAttribute("href");
    const prevOgUrl = ogUrl.getAttribute("content");

    const url = SITE_ORIGIN + (path || (typeof window !== "undefined" ? window.location.pathname : "/"));

    desc.setAttribute("content", description || DEFAULT_DESCRIPTION);
    canonical.setAttribute("href", url);
    ogUrl.setAttribute("content", url);

    return () => {
      document.title = DEFAULT_TITLE;
      if (prevDesc) desc.setAttribute("content", prevDesc);
      if (prevCanonical) canonical.setAttribute("href", prevCanonical);
      if (prevOgUrl) ogUrl.setAttribute("content", prevOgUrl);
    };
  }, [title, description, path]);
}
