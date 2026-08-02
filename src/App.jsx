import React, { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { trackPageView, initAttribution, initScrollDepth } from "./tracker.js";
import usePageMeta from "./hooks/usePageMeta.js";

import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Story from "./components/Story.jsx";
import Products from "./components/Products.jsx";
import TrustBadges from "./components/TrustBadges.jsx";
import Reviews from "./components/Reviews.jsx";
import FAQ from "./components/FAQ.jsx";
import Footer from "./components/Footer.jsx";
import OrderForm from "./components/OrderForm.jsx";
import FloatingContactButtons from "./components/FloatingContactButtons.jsx";
import StickyOrderBar from "./components/StickyOrderBar.jsx";
import BackToTop from "./components/BackToTop.jsx";

import { defaultPageData } from "./data/siteData.js";
import { fetchSiteContent } from "./services/contentService.js";
import { findCampaignBySlug, resolveCampaign, normalizeSlug } from "./utils/campaigns.js";
import { initTapFeedback } from "./utils/tapFeedback.js";

// Code-split: most visitors never hit /admin or a specific campaign landing
// page, so keep them out of the main bundle entirely.
const AdminPanel = lazy(() => import("./components/AdminPanel.jsx"));
// Both /candy, /moshla and every /lp/<slug> render the one shared landing
// template; a single lazy import keeps them all in one route chunk.
const ProductLandingPage = lazy(() => import("./landing-pages/ProductLandingPage.jsx"));
const NotFound = lazy(() => import("./components/NotFound.jsx"));

function RouteLoader() {
  return (
    <div className="min-h-screen bg-green-deep flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-cream/20 border-t-amber animate-spin" />
    </div>
  );
}

/** Fires a GA4/Pixel page_view on every SPA route change (gtag config has send_page_view: false). */
function usePageViewTracking() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);
}

function MainSite({ pageData }) {
  usePageMeta(null, null, "/"); // resets to site defaults when navigating back to "/"

  return (
    <ToastProvider>
      <CartProvider>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-amber focus:text-cream focus:px-5 focus:py-2.5">
          মূল কন্টেন্টে যান
        </a>
        <Header />
        <main id="main-content">
          <Hero data={pageData.hero} />
          <Story data={pageData.story} />
          <Products products={pageData.products} />
          <TrustBadges />
          <Reviews reviews={pageData.reviews} />
          <FAQ />
        </main>
        <Footer brand={pageData.brand} />
        <OrderForm
          brand={pageData.brand}
          formData={pageData.formData}
          products={pageData.products}
          repeatOffer={pageData.repeatOffer}
        />
        <FloatingContactButtons brand={pageData.brand} />
        <StickyOrderBar />
        <BackToTop />
      </CartProvider>
    </ToastProvider>
  );
}

export default function App() {
  // Single source of truth for all editable content — AdminPanel writes
  // here, every component downstream reads from here via props only.
  const [pageData, setPageData] = useState(defaultPageData);

  // Turn on the site-wide tap feedback (bloom + haptics) once.
  useEffect(() => {
    initTapFeedback();
  }, []);

  // Capture fbclid → _fbc as early as React can (the inline snippet in
  // index.html already tried; this covers client-side navigations), and start
  // scroll-depth instrumentation. Returns the listener teardown.
  useEffect(() => {
    initAttribution();
    return initScrollDepth();
  }, []);

  // Pull the latest content saved from /admin — products, campaigns and site
  // copy — in one request. If the backend isn't set up (or is unreachable),
  // we silently keep the defaults bundled in siteData.js so the site always
  // renders something correct.
  useEffect(() => {
    let cancelled = false;
    fetchSiteContent().then(({ products, campaigns, site }) => {
      if (cancelled) return;
      setPageData((prev) => {
        const next = { ...prev };
        if (products && products.length) next.products = products;
        if (campaigns) next.campaigns = campaigns; // [] is valid (all campaigns deleted)
        if (site && typeof site === "object") {
          // Site content is a partial object; only override what it carries.
          if (site.brand) next.brand = { ...prev.brand, ...site.brand };
          if (site.hero) next.hero = { ...prev.hero, ...site.hero };
          if (site.story) next.story = { ...prev.story, ...site.story };
          if (site.formData) next.formData = { ...prev.formData, ...site.formData };
          if (Array.isArray(site.reviews) && site.reviews.length) next.reviews = site.reviews;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  usePageViewTracking();
  const location = useLocation();

  return (
    <Suspense fallback={<RouteLoader />}>
      {/* Keyed by pathname so each page mounts with a gentle fade instead of
          snapping in. Page-level navigations are exactly where a remount is
          fine — no in-page state is meant to survive them. */}
      <div key={location.pathname} className="route-enter">
        <Routes location={location}>
          <Route path="/" element={<MainSite pageData={pageData} />} />

          {/* ── One landing page per product, one URL per landing page ──────
              Every campaign in siteData gets its own top-level route from its
              own slug: /candy, /moshla, /combo, /coffee. Add a campaign in
              /admin and its URL exists immediately — no code change, no route
              to remember to register.

              Why generated instead of hand-written <Route> lines: four
              products meant two of them (/combo, /coffee) had no clean URL at
              all and were only reachable at /lp/combo. Any hand-maintained
              list drifts the moment someone adds a product.

              This is what Meta needs. Each ad set points at its own URL, so
              ViewContent, InitiateCheckout and Purchase are attributable to a
              single product, and `event_source_url` is unambiguous. */}
          {(pageData.campaigns || [])
            .filter((c) => c.active !== false && c.slug)
            .map((c) => (
              <Route
                key={c.id || c.slug}
                path={`/${normalizeSlug(c.slug)}`}
                element={<CampaignRoute pageData={pageData} slug={c.slug} fallbackProductId={c.productId} />}
              />
            ))}

          {/* Legacy /lp/<slug> links REDIRECT to the clean URL rather than
              rendering a second copy.

              This matters more than it looks: when /candy and /lp/candy both
              rendered the same page, one product had two URLs. Meta then saw
              two `event_source_url` values for the same funnel, any URL-based
              custom audience covered only half the traffic, and Google treated
              it as duplicate content. `replace` keeps the browser Back button
              sane. */}
          <Route path="/lp/:slug" element={<LegacyLpRedirect />} />

          {/* No-code admin — excluded from indexing via robots.txt */}
          <Route path="/admin" element={<AdminPanel pageData={pageData} setPageData={setPageData} />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Suspense>
  );
}

/** /lp/<slug> → /<slug>. Keeps old ad links and printed QR codes alive
 *  without ever serving the same product at two different URLs. */
function LegacyLpRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/${normalizeSlug(slug)}`} replace />;
}

/**
 * Resolves the campaign for a landing route and renders it. Falls back to the
 * base product if the campaign was deleted but the named route still exists,
 * and to NotFound for an unknown /lp/<slug>.
 */
function CampaignRoute({ pageData, slug: slugProp, fallbackProductId }) {
  const params = useParams();
  const slug = slugProp || params.slug;
  const campaign = findCampaignBySlug(pageData.campaigns, slug);

  if (campaign) {
    const resolved = resolveCampaign(campaign, pageData.products);
    if (resolved) {
      return (
        <ProductLandingPage
          resolved={resolved}
          brand={pageData.brand}
          reviews={pageData.reviews}
          repeatOffer={pageData.repeatOffer}
        />
      );
    }
  }

  // Named alias whose campaign was removed — still show the product directly.
  if (fallbackProductId) {
    const product = pageData.products.find((p) => p.id === fallbackProductId) || pageData.products[0];
    if (product) {
      return (
        <ProductLandingPage
          product={product}
          brand={pageData.brand}
          reviews={pageData.reviews}
          repeatOffer={pageData.repeatOffer}
        />
      );
    }
  }

  return <NotFound />;
}
