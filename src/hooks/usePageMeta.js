import { useEffect } from "react";

const DEFAULT_TITLE = "Orree | ওরি — প্রকৃতির আভিজাত্য আপনার প্রাপ্য";
const DEFAULT_DESCRIPTION =
  "চুইঝাল ক্যান্ডি, চুইঝাল চায়ের মসলা আর চুইঝাল বাইটস — শিকড়ের স্বাদ, যত্নে বানানো।";

/**
 * Keeps the browser tab title (and description meta) accurate per SPA route.
 * This does NOT fix social-share/crawler previews for sub-routes — those
 * still read the static index.html — but it's a real UX win for anyone
 * navigating with multiple tabs open, and a quick SEO signal for JS-executing
 * crawlers. For true per-route OG previews, prerendering or an SSR setup
 * (e.g. Vite SSR, Next.js) would be the next step.
 */
export default function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | Orree` : DEFAULT_TITLE;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    const prevContent = meta.getAttribute("content");
    meta.setAttribute("content", description || DEFAULT_DESCRIPTION);

    return () => {
      document.title = DEFAULT_TITLE;
      if (prevContent) meta.setAttribute("content", prevContent);
    };
  }, [title, description]);
}
