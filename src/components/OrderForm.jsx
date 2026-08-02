import React, { useEffect, useRef, useState } from "react";
import { X, Minus, Plus, Trash2, ShieldCheck, Truck, Copy, Check, PackageCheck, PhoneCall, Gift } from "lucide-react";
import { WhatsAppIcon, MessengerIcon, BRAND_COLORS } from "./BrandIcons.jsx";
import { useCart } from "../context/CartContext.jsx";
import SuccessSeal from "./SuccessSeal.jsx";
import { trackOrderPlaced, trackMessengerClick, trackWhatsAppClick, trackCallClick, trackCtaClick, trackRewardCopy } from "../tracker.js";
import { haptic } from "../utils/tapFeedback.js";
import { submitOrder, getDeliveryFee, buildWhatsAppUrl, DELIVERY_ZONES } from "../services/orderService.js";
import { copyAndOpenMessenger } from "../services/messenger.js";
import { getCooldownRemaining, startCooldown } from "../services/antiSpam.js";
import useFocusTrap from "../hooks/useFocusTrap.js";
import FreeShippingBar from "./FreeShippingBar.jsx";
import CrossSell from "./CrossSell.jsx";
import TurnstileWidget, { isTurnstileEnabled } from "./TurnstileWidget.jsx";
import ProductThumb from "./ProductThumb.jsx";
import { getPrimaryImage } from "../utils/productImages.js";


/**
 * The COD reassurance strip. This sits ABOVE the fields on purpose.
 *
 * A Meta-ad visitor arriving at a form has one live question — "what happens
 * if this is rubbish?" — and every field they read before it gets answered is
 * a field they might abandon on. Answer first, ask second.
 */
function RiskReversal({ shipping }) {
  const fees = [shipping?.insideDhaka, shipping?.outsideDhaka, shipping?.flatFee].filter(
    (n) => typeof n === "number"
  );
  const alwaysFree = fees.length > 0 && fees.every((n) => n === 0);

  const points = [
    { icon: PackageCheck, text: "পণ্য হাতে পেয়ে, চেক করে তারপর টাকা দিন" },
    { icon: ShieldCheck, text: "কোনো অগ্রিম পেমেন্ট লাগবে না" },
    // Free delivery only earns a slot when it is actually free everywhere.
    // Hard-coding the claim would leave a lie on the page the day pricing
    // changes, so it reads from the same object the totals do.
    ...(alwaysFree
      ? [{ icon: Truck, text: "সারা বাংলাদেশে ডেলিভারি সম্পূর্ণ ফ্রি" }]
      : []),
    { icon: PhoneCall, text: "অর্ডারের পর আমরা কল করে কনফার্ম করব" },
  ];
  return (
    <ul className="mb-5 space-y-2 rounded-2xl border border-amber/25 bg-amber/[0.07] p-4">
      {points.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-cream/85">
          <Icon size={16} className="mt-px shrink-0 text-amber" aria-hidden="true" />
          {text}
        </li>
      ))}
    </ul>
  );
}

/**
 * The next-order reward, shown once the order is confirmed.
 *
 * Why it belongs here and not only in the printed letter: the letter arrives
 * days later, gets thrown out with the packaging, or never gets read. This is
 * the one moment the customer is guaranteed to be looking at a screen and
 * feeling good about the purchase — the cheapest repeat-order prompt you will
 * ever get. The physical letter then reinforces it rather than carrying the
 * whole job alone.
 *
 * Placed BELOW the order summary on purpose. The customer's first question
 * after ordering is "did it work, and what did it cost me?" — answer that
 * first. An upsell above the confirmation reads as a shop that cares more
 * about the next sale than this one.
 */
function RepeatReward({ offer, code }) {
  const [copied, setCopied] = useState(false);

  if (!offer?.enabled || !code) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      trackRewardCopy(code);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked (older WebViews, insecure context). The code is
      // printed right there in large type — they can still read it.
      setCopied(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-amber/30 bg-amber/[0.07] p-5 text-left animate-fade-up" style={{ animationDelay: "0.36s" }}>
      <p className="mb-1 flex items-center gap-2 font-display text-[14.5px] font-semibold text-amber">
        <Gift size={16} className="shrink-0" aria-hidden="true" />
        {offer.headline}
      </p>
      <p className="mb-3.5 text-[13px] leading-relaxed text-cream/70">{offer.detail}</p>

      <div className="flex items-center gap-2.5">
        <code className="flex-1 select-all rounded-xl border border-dashed border-amber/45 bg-green-deeper/50 px-3 py-2.5 text-center font-display text-[15px] font-bold tracking-wider text-cream">
          {code}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="কোড কপি করুন"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cream/20 text-cream/70 transition-colors hover:border-amber hover:text-amber active:scale-95"
        >
          {copied ? <Check size={17} className="text-amber" /> : <Copy size={16} />}
        </button>
      </div>

      {copied && <p className="mt-2 text-[12px] text-amber/90">কোড কপি হয়েছে</p>}

      {offer.validDays > 0 && (
        <p className="mt-2.5 text-[12px] text-cream/45">
          মেয়াদ: আজ থেকে {offer.validDays.toLocaleString("bn-BD")} দিন
        </p>
      )}
    </div>
  );
}

export default function OrderForm({ brand, formData, products = [], source, repeatOffer }) {
  const { items, totalPrice, updateQty, removeItem, addItem, isOrderFormOpen, closeOrderForm, clearCart } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [zone, setZone] = useState("inside_dhaka");
  const [placedOrder, setPlacedOrder] = useState(null);
  const [orderMessage, setOrderMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileResetRef = useRef(null);
  const dialogRef = useFocusTrap(isOrderFormOpen);
  const [errors, setErrors] = useState({});

  const [honeypot, setHoneypot] = useState("");
  const openedAtRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeOrderForm();
    if (isOrderFormOpen) {
      openedAtRef.current = Date.now();
      setCooldown(getCooldownRemaining());
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOrderFormOpen, closeOrderForm]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!isOrderFormOpen) return null;

  /**
   * Cart lines saved by an older build have no `image`. Rather than showing
   * those returning customers a letter-placeholder, look the product up in the
   * live catalogue by id. Costs nothing — `products` is already in props.
   */
  const catalogueImage = (id) => getPrimaryImage(products.find((p) => p.id === id));

  const deliveryFee = getDeliveryFee(totalPrice, brand.shipping, zone);
  const grandTotal = totalPrice + deliveryFee;

  const normalizePhone = (v) => v.trim().replace(/[\s-]/g, "").replace(/^\+?880/, "0");

  const fieldValid = {
    name: form.name.trim().length > 1,
    phone: /^01[3-9]\d{8}$/.test(normalizePhone(form.phone)),
    address: form.address.trim().length > 5,
  };

  /** Clears a field's error the moment it becomes valid — no "fix it, then
   *  submit again to find out" loop, which is where mobile users bail. */
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!fieldValid.name) next.name = "নামটা লিখুন";
    if (!fieldValid.phone) next.phone = "সঠিক ফোন নম্বর দিন (যেমন 01XXXXXXXXX)";
    if (!fieldValid.address) next.address = "পুরো ঠিকানাটা লিখুন — বাসা, রোড, এলাকা, জেলা";
    if (items.length === 0) next.cart = "কার্টে অন্তত একটা প্রোডাক্ট যোগ করুন";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting || cooldown > 0) return;

    setSubmitting(true);
    setSaveFailed(false);
    try {
      const normalizedForm = { ...form, phone: normalizePhone(form.phone) };
      const secondsOnForm = openedAtRef.current ? Math.round((Date.now() - openedAtRef.current) / 1000) : null;

      const { order, message, saved } = await submitOrder({
        items, totalPrice, form: normalizedForm, shipping: brand.shipping,
        channel: "website", source, honeypot, secondsOnForm, turnstileToken, zone,
        rewardPrefix: repeatOffer?.codePrefix,
      });

      setOrderMessage(message);

      if (saved) {
        // Purchase fires ONLY on a confirmed save. Previously it fired
        // unconditionally, so every failed write still reported a conversion
        // to Meta and GA4 — inflating ROAS, teaching the algorithm to chase
        // people who never actually ordered, and making your Ads Manager
        // numbers irreconcilable with your sheet.
        trackOrderPlaced(order);
        startCooldown();
        setPlacedOrder(order);
        haptic("success");
      } else {
        setSaveFailed(true);
        turnstileResetRef.current?.(); // tokens are single-use
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    closeOrderForm();
    if (placedOrder) {
      clearCart();
      setForm({ name: "", phone: "", address: "" });
      setPlacedOrder(null);
      setOrderMessage("");
      setCopied(false);
      setSaveFailed(false);
      setErrors({});
    }
  };

  const handleWhatsAppFollowUp = () => {
    trackWhatsAppClick("order_confirmation");
    window.open(buildWhatsAppUrl(orderMessage, brand.whatsapp), "_blank", "noopener,noreferrer");
  };

  const handleMessengerFollowUp = async () => {
    trackMessengerClick("order_confirmation");
    setCopied(await copyAndOpenMessenger(orderMessage, brand.messengerUsername));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="বন্ধ করুন"
        onClick={handleClose}
        className="sheet-backdrop absolute inset-0 bg-green-deeper/80 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={formData.title}
        tabIndex={-1}
        className="sheet-in sheet-maxh relative w-full sm:max-w-lg overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-green-deep border border-cream/15 shadow-glass outline-none"
      >
        <div className="sm:hidden mx-auto mt-2.5 h-1 w-10 rounded-full bg-cream/20" aria-hidden="true" />
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 sm:px-7 pt-6 pb-4 bg-green-deep/95 backdrop-blur border-b border-cream/10">
          <div>
            <h3 className="font-display font-bold text-xl text-cream">
              {placedOrder ? "অর্ডার সম্পন্ন!" : formData.title}
            </h3>
            <p className="text-cream/55 text-[13px] mt-0.5">
              {placedOrder ? "আমরা শীঘ্রই আপনাকে কল করব" : formData.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="বন্ধ করুন"
            className="flex h-9 w-9 items-center justify-center rounded-full glass hover:border-amber/40"
          >
            <X size={16} className="text-cream" />
          </button>
        </div>

        <div className="px-6 sm:px-7 py-6">
          {placedOrder ? (
            /* ── Order completed ───────────────────────────────────── */
            <div className="flex flex-col items-center text-center py-4">
              <SuccessSeal />

              <h4 className="font-display font-bold text-xl text-cream mb-2 animate-fade-up" style={{ animationDelay: "0.15s" }}>
                ধন্যবাদ, {placedOrder.customer.name}!
              </h4>
              <p className="text-cream/70 text-[14.5px] leading-relaxed max-w-sm mb-6 animate-fade-up" style={{ animationDelay: "0.22s" }}>
                আপনার অর্ডারটি আমরা পেয়েছি। আমাদের একজন প্রতিনিধি খুব শীঘ্রই{" "}
                <span className="text-cream">{placedOrder.customer.phone}</span> নম্বরে কল করে কনফার্ম করবেন।
              </p>

              <div className="w-full rounded-2xl glass p-5 text-left mb-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-cream/10">
                  <span className="text-cream/55 text-[13px]">অর্ডার নম্বর</span>
                  <span className="font-display font-bold text-amber text-[15px]">{placedOrder.id}</span>
                </div>
                {/* Smaller thumbs than the cart, and not tappable: this is a
                    receipt, not a shopping view. They confirm "yes, that's what
                    I bought" without pushing the reward code and the chat
                    buttons below the fold on a small phone. */}
                {placedOrder.items.map((i) => (
                  <div key={i.id} className="flex items-center gap-2.5 text-[13.5px] text-cream/70 mb-2">
                    <ProductThumb src={catalogueImage(i.id)} title={i.name} size={34} peekable={false} />
                    <span className="min-w-0 flex-1 truncate">{i.name} × {i.quantity}</span>
                    <span className="shrink-0">৳{(i.price * i.quantity).toLocaleString("bn-BD")}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[13.5px] text-cream/55 mt-2 pt-2 border-t border-cream/10">
                  <span>ডেলিভারি চার্জ</span>
                  <span>{placedOrder.deliveryFee > 0 ? `৳${placedOrder.deliveryFee}` : "ফ্রি"}</span>
                </div>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-cream/70 text-[14px]">সর্বমোট (ক্যাশ অন ডেলিভারি)</span>
                  <span className="font-display font-bold text-lg text-cream">
                    ৳{placedOrder.total.toLocaleString("bn-BD")}
                  </span>
                </div>
              </div>

              <RepeatReward offer={repeatOffer} code={placedOrder.rewardCode} />

              <p className="text-cream/50 text-[13px] mb-3 mt-6">চাইলে এখনই চ্যাটে অর্ডারটি নিশ্চিত করতে পারেন —</p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={handleWhatsAppFollowUp}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3.5 font-display font-semibold text-white text-[13.5px] transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: BRAND_COLORS.whatsapp }}
                >
                  <WhatsAppIcon size={17} />
                  হোয়াটসঅ্যাপ
                </button>
                <button
                  type="button"
                  onClick={handleMessengerFollowUp}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3.5 font-display font-semibold text-white text-[13.5px] transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: BRAND_COLORS.messenger }}
                >
                  {copied ? <Copy size={16} /> : <MessengerIcon size={17} />}
                  {copied ? "কপি হয়েছে" : "মেসেঞ্জার"}
                </button>
              </div>
              {copied && (
                <p className="text-cream/50 text-[12.5px] mt-3 leading-relaxed">
                  অর্ডারের বিবরণ কপি হয়েছে — মেসেঞ্জারে পেস্ট করে পাঠিয়ে দিন।
                </p>
              )}

              <button type="button" onClick={handleClose} className="btn-outline mt-6 w-full">
                ঠিক আছে
              </button>
            </div>
          ) : (
            /* ── Checkout form ─────────────────────────────────────── */
            <>
              {items.length > 0 && (
                <div className="mb-6">
                  {brand.shipping && <FreeShippingBar totalPrice={totalPrice} shipping={brand.shipping} />}

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-2xl glass p-3">
                        <ProductThumb
                          src={item.image || catalogueImage(item.id)}
                          alt=""
                          title={item.title}
                          size={52}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-cream text-[14.5px] font-medium truncate">{item.title}</p>
                          <p className="text-cream/50 text-[12.5px]">
                            {item.currency}{item.price.toLocaleString("bn-BD")} · {item.weight}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* 36px hit targets — the old 28px buttons failed the
                              WCAG 2.5.8 / Meta-traffic thumb test outright. */}
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="h-9 w-9 flex items-center justify-center rounded-full border border-cream/20 text-cream/70 hover:border-amber hover:text-amber active:scale-95 transition"
                            aria-label={`${item.title} — পরিমাণ কমান`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-cream text-sm tabular-nums">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="h-9 w-9 flex items-center justify-center rounded-full border border-cream/20 text-cream/70 hover:border-amber hover:text-amber active:scale-95 transition"
                            aria-label={`${item.title} — পরিমাণ বাড়ান`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`${item.title} মুছে ফেলুন`}
                          className="flex h-9 w-9 items-center justify-center text-cream/40 hover:text-amber shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {products.length > 1 && (
                    <div className="mt-3">
                      <CrossSell products={products} cartItems={items} onAdd={addItem} />
                    </div>
                  )}

                  <div className="mt-3 space-y-1.5 px-1">
                    <div className="flex items-center justify-between text-[13.5px] text-cream/55">
                      <span>সাবটোটাল</span>
                      <span className="tabular-nums">৳{totalPrice.toLocaleString("bn-BD")}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13.5px] text-cream/55">
                      <span>ডেলিভারি চার্জ</span>
                      <span className="tabular-nums">{deliveryFee > 0 ? `৳${deliveryFee.toLocaleString("bn-BD")}` : "ফ্রি"}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-cream/10">
                      <span className="text-cream/70 text-[14px]">সর্বমোট</span>
                      <span className="font-display font-bold text-lg text-cream tabular-nums">
                        ৳{grandTotal.toLocaleString("bn-BD")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {errors.cart && <p className="text-amber text-[13px] mb-4">{errors.cart}</p>}

              {saveFailed && (
                <div className="rounded-2xl border border-amber/40 bg-amber/10 p-4 mb-5" role="alert">
                  <p className="text-cream text-[14px] font-medium mb-1.5">অর্ডারটি পাঠানো যায়নি</p>
                  <p className="text-cream/70 text-[13.5px] leading-relaxed mb-3">
                    ইন্টারনেট সংযোগে সমস্যা হতে পারে। আপনার তথ্য এখনও এখানেই আছে — আবার চেষ্টা করুন, অথবা নিচের
                    বাটনে চেপে সরাসরি হোয়াটসঅ্যাপে অর্ডারটি পাঠিয়ে দিন।
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        trackWhatsAppClick("save_failed_fallback");
                        window.open(buildWhatsAppUrl(orderMessage, brand.whatsapp), "_blank", "noopener,noreferrer");
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 px-3 font-display font-semibold text-white text-[13px] transition-transform active:scale-95"
                      style={{ backgroundColor: BRAND_COLORS.whatsapp }}
                    >
                      <WhatsAppIcon size={15} />
                      হোয়াটসঅ্যাপে পাঠান
                    </button>
                    <a
                      href={`tel:${brand.phone}`}
                      onClick={() => trackCallClick("save_failed_fallback")}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-cream/25 px-3 py-2.5 text-[13px] font-display font-semibold text-cream hover:border-amber hover:text-amber transition-colors"
                    >
                      কল করুন
                    </a>
                  </div>
                </div>
              )}

              <RiskReversal shipping={brand.shipping} />

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="field-group">
                  <label htmlFor="name" className="block text-[13px] text-cream/60 mb-1.5">আপনার নাম</label>
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      enterKeyHint="next"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="যেমন: রহিমা আক্তার"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-err" : undefined}
                      className="field-input pr-11"
                    />
                    {fieldValid.name && <Check size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber animate-bump" />}
                  </div>
                  {errors.name && <p id="name-err" className="text-amber text-[12.5px] mt-1">{errors.name}</p>}
                </div>

                <div className="field-group">
                  <label htmlFor="phone" className="block text-[13px] text-cream/60 mb-1.5">ফোন নম্বর</label>
                  <div className="relative">
                    <input
                      id="phone"
                      type="tel"
                      /* inputMode="tel" gives the real phone keypad (with +*#)
                         instead of a bare number pad — fewer mistyped numbers,
                         and a wrong number is a dead COD order. */
                      inputMode="tel"
                      autoComplete="tel"
                      enterKeyHint="next"
                      maxLength={14}
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="01XXXXXXXXX"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? "phone-err" : "phone-hint"}
                      className="field-input pr-11"
                    />
                    {fieldValid.phone && <Check size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber animate-bump" />}
                  </div>
                  {errors.phone
                    ? <p id="phone-err" className="text-amber text-[12.5px] mt-1">{errors.phone}</p>
                    : <p id="phone-hint" className="text-cream/40 text-[12px] mt-1">এই নম্বরেই আমরা কল করে অর্ডার কনফার্ম করব</p>}
                </div>

                {/* Delivery zone. Quoting one flat nationwide fee and then
                    having the courier ask for more at the door is the single
                    biggest driver of COD refusals in Bangladesh — the customer
                    feels tricked and refuses the parcel, and you pay return
                    freight. Two taps here removes that failure entirely. */}
                <fieldset className="field-group">
                  <legend className="block text-[13px] text-cream/60 mb-1.5">ডেলিভারি এলাকা</legend>
                  <div className="grid grid-cols-2 gap-2.5">
                    {DELIVERY_ZONES.map((z) => {
                      const fee = getDeliveryFee(totalPrice, brand.shipping, z.id);
                      const active = zone === z.id;
                      return (
                        <button
                          key={z.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => { setZone(z.id); trackCtaClick(`zone_${z.id}`, "order_form"); }}
                          className={`rounded-2xl border px-3 py-3 text-left transition ${
                            active ? "border-amber bg-amber/10" : "border-cream/15 hover:border-cream/30"
                          }`}
                        >
                          <span className="block font-display font-semibold text-[14px] text-cream">{z.label}</span>
                          <span className="block text-[12px] text-cream/55 mt-0.5">
                            {fee > 0 ? `৳${fee} · ${z.note}` : `ফ্রি · ${z.note}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="field-group">
                  <label htmlFor="address" className="block text-[13px] text-cream/60 mb-1.5">ডেলিভারির ঠিকানা</label>
                  <div className="relative">
                    <textarea
                      id="address"
                      rows={2}
                      autoComplete="street-address"
                      enterKeyHint="done"
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      placeholder="বাসা/রোড/এলাকা/থানা/জেলা"
                      aria-invalid={!!errors.address}
                      aria-describedby={errors.address ? "address-err" : undefined}
                      className="field-input pr-11 resize-none"
                    />
                    {fieldValid.address && <Check size={17} className="absolute right-4 top-4 text-amber animate-bump" />}
                  </div>
                  {errors.address && <p id="address-err" className="text-amber text-[12.5px] mt-1">{errors.address}</p>}
                </div>

                {/* Honeypot: hidden from people & screen readers, tempting to bots. */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="company">Company</label>
                  <input id="company" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </div>

                {isTurnstileEnabled() && <TurnstileWidget onToken={setTurnstileToken} resetRef={turnstileResetRef} />}

                <button
                  type="submit"
                  disabled={submitting || cooldown > 0 || (isTurnstileEnabled() && !turnstileToken)}
                  className="btn-amber w-full !py-4 disabled:opacity-60"
                >
                  {submitting
                    ? "পাঠানো হচ্ছে..."
                    : cooldown > 0
                      ? `আরেকটি অর্ডার করতে ${cooldown} সেকেন্ড অপেক্ষা করুন`
                      : isTurnstileEnabled() && !turnstileToken
                        ? "একটু অপেক্ষা করুন..."
                        : `ক্যাশ অন ডেলিভারিতে অর্ডার করুন · ৳${grandTotal.toLocaleString("bn-BD")}`}
                </button>

                <p className="text-cream/45 text-[12.5px] leading-relaxed text-center">{formData.note}</p>

                <div className="flex items-center justify-center gap-5 text-cream/45 text-[12px]">
                  <span className="inline-flex items-center gap-1.5"><Truck size={13} className="text-amber" /> ফ্রি ডেলিভারি</span>
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-amber" /> ১০০% অরিজিনাল</span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
