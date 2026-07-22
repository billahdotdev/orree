import React, { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import { trackPageView } from "./tracker.js";
import usePageMeta from "./hooks/usePageMeta.js";

import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Story from "./components/Story.jsx";
import Products from "./components/Products.jsx";
import TrustBadges from "./components/TrustBadges.jsx";
import Reviews from "./components/Reviews.jsx";
import FAQ from "./components/FAQ.jsx";
import Footer from "./components/Footer.jsx";
import OrderForm, { WhatsAppButton } from "./components/OrderForm.jsx";
import StickyOrderBar from "./components/StickyOrderBar.jsx";

import { defaultPageData } from "./data/siteData.js";

// Code-split: most visitors never hit /admin or a specific campaign landing
// page, so keep them out of the main bundle entirely.
const AdminPanel = lazy(() => import("./components/AdminPanel.jsx"));
const ProductOneLanding = lazy(() => import("./landing-pages/ProductOneLanding.jsx"));
const ProductTwoLanding = lazy(() => import("./landing-pages/ProductTwoLanding.jsx"));
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
  usePageMeta(null, null); // resets to site defaults when navigating back to "/"

  return (
    <CartProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-amber focus:text-cream focus:px-5 focus:py-2.5">
        মূল কন্টেন্টে যান
      </a>
      <Header />
      <main id="main-content" className="pb-20 sm:pb-0">
        <Hero data={pageData.hero} />
        <Story data={pageData.story} />
        <Products products={pageData.products} />
        <TrustBadges />
        <Reviews reviews={pageData.reviews} />
        <FAQ />
      </main>
      <Footer brand={pageData.brand} />
      <OrderForm brand={pageData.brand} formData={pageData.formData} />
      <WhatsAppButton brand={pageData.brand} />
      <StickyOrderBar />
    </CartProvider>
  );
}

export default function App() {
  // Single source of truth for all editable content — AdminPanel writes
  // here, every component downstream reads from here via props only.
  const [pageData, setPageData] = useState(defaultPageData);

  usePageViewTracking();

  const candyProduct = pageData.products.find((p) => p.id === "chui-jhal-candy") || pageData.products[0];
  const moshlaProduct = pageData.products.find((p) => p.id === "chui-jhal-cha-moshla") || pageData.products[1];

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<MainSite pageData={pageData} />} />

        {/* Plug-and-play ad-campaign landing pages — isolated, safe to delete anytime */}
        <Route path="/candy" element={<ProductOneLanding product={candyProduct} brand={pageData.brand} />} />
        <Route path="/moshla" element={<ProductTwoLanding product={moshlaProduct} brand={pageData.brand} />} />

        {/* No-code admin — excluded from indexing via robots.txt */}
        <Route path="/admin" element={<AdminPanel pageData={pageData} setPageData={setPageData} />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
