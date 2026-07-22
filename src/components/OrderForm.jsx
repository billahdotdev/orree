import React, { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2, CheckCircle2, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { trackOrderPlaced, trackWhatsAppClick } from "../tracker.js";
import { submitOrder } from "../services/orderService.js";
import useFocusTrap from "../hooks/useFocusTrap.js";

export default function OrderForm({ brand, formData }) {
  const { items, totalPrice, updateQty, removeItem, isOrderFormOpen, closeOrderForm, clearCart } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useFocusTrap(isOrderFormOpen);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeOrderForm();
    if (isOrderFormOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOrderFormOpen, closeOrderForm]);

  if (!isOrderFormOpen) return null;

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "নামটা লিখুন";
    const normalizedPhone = form.phone.trim().replace(/[\s-]/g, "").replace(/^\+?880/, "0");
    if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) next.phone = "সঠিক ফোন নম্বর দিন (যেমন 01XXXXXXXXX)";
    if (!form.address.trim()) next.address = "ডেলিভারির ঠিকানা লিখুন";
    if (items.length === 0) next.cart = "কার্টে অন্তত একটা প্রোডাক্ট যোগ করুন";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const normalizedForm = { ...form, phone: form.phone.trim().replace(/[\s-]/g, "").replace(/^\+?880/, "0") };
      const { order, redirectUrl } = await submitOrder({
        items,
        totalPrice,
        form: normalizedForm,
        whatsappNumber: brand.whatsapp,
      });
      trackOrderPlaced(order);
      window.open(redirectUrl, "_blank", "noopener,noreferrer");
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    closeOrderForm();
    if (submitted) {
      clearCart();
      setForm({ name: "", phone: "", address: "", note: "" });
      setSubmitted(false);
      setErrors({});
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="বন্ধ করুন"
        onClick={handleClose}
        className="absolute inset-0 bg-green-deeper/80 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={formData.title}
        tabIndex={-1}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-green-deep border border-cream/15 shadow-glass animate-fade-up outline-none"
      >
        <div className="sticky top-0 flex items-center justify-between px-6 sm:px-7 pt-6 pb-4 bg-green-deep/95 backdrop-blur border-b border-cream/10">
          <div>
            <h3 className="font-display font-bold text-xl text-cream">{formData.title}</h3>
            <p className="text-cream/55 text-[13px] mt-0.5">{formData.subtitle}</p>
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
          {submitted ? (
            <div className="flex flex-col items-center text-center py-8">
              <CheckCircle2 size={48} className="text-amber mb-4" />
              <h4 className="font-display font-semibold text-lg text-cream mb-2">
                হোয়াটসঅ্যাপ খুলে দিয়েছি
              </h4>
              <p className="text-cream/65 text-[14.5px] leading-relaxed max-w-sm">
                আপনার অর্ডারের তথ্য দিয়ে একটা মেসেজ রেডি করে দিয়েছি — শুধু পাঠিয়ে দিন, আমরা দ্রুত
                কনফার্ম করে জানাবো। মেসেজ না গেলে সরাসরি {brand.phoneDisplay} নম্বরে কল করতে পারেন।
              </p>
              <button type="button" onClick={handleClose} className="btn-amber mt-7">
                ঠিক আছে
              </button>
            </div>
          ) : (
            <>
              {items.length > 0 && (
                <div className="mb-6 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-2xl glass p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-cream text-[14.5px] font-medium truncate">{item.title}</p>
                        <p className="text-cream/50 text-[12.5px]">
                          {item.currency}
                          {item.price.toLocaleString("bn-BD")} · {item.weight}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="h-7 w-7 flex items-center justify-center rounded-full border border-cream/20 text-cream/70 hover:border-amber hover:text-amber"
                          aria-label="কমান"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-5 text-center text-cream text-sm">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="h-7 w-7 flex items-center justify-center rounded-full border border-cream/20 text-cream/70 hover:border-amber hover:text-amber"
                          aria-label="বাড়ান"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label="মুছে ফেলুন"
                        className="text-cream/40 hover:text-amber shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 px-1">
                    <span className="text-cream/60 text-[14px]">সর্বমোট</span>
                    <span className="font-display font-bold text-lg text-cream">
                      ৳{totalPrice.toLocaleString("bn-BD")}
                    </span>
                  </div>
                </div>
              )}
              {errors.cart && <p className="text-amber text-[13px] mb-4">{errors.cart}</p>}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="name" className="block text-[13px] text-cream/60 mb-1.5">
                    আপনার নাম
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="যেমন: রহিমা আক্তার"
                    className="w-full rounded-xl bg-cream/5 border border-cream/15 px-4 py-2.5 text-cream placeholder:text-cream/30 focus:border-amber outline-none transition-colors"
                  />
                  {errors.name && <p className="text-amber text-[12.5px] mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[13px] text-cream/60 mb-1.5">
                    ফোন নম্বর
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-xl bg-cream/5 border border-cream/15 px-4 py-2.5 text-cream placeholder:text-cream/30 focus:border-amber outline-none transition-colors"
                  />
                  {errors.phone && <p className="text-amber text-[12.5px] mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="address" className="block text-[13px] text-cream/60 mb-1.5">
                    ডেলিভারির ঠিকানা
                  </label>
                  <textarea
                    id="address"
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="বাসা/রোড/এলাকা/জেলা"
                    className="w-full rounded-xl bg-cream/5 border border-cream/15 px-4 py-2.5 text-cream placeholder:text-cream/30 focus:border-amber outline-none transition-colors resize-none"
                  />
                  {errors.address && <p className="text-amber text-[12.5px] mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label htmlFor="note" className="block text-[13px] text-cream/60 mb-1.5">
                    বিশেষ কোনো নোট (ঐচ্ছিক)
                  </label>
                  <input
                    id="note"
                    type="text"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="যেমন: সন্ধ্যার পর ডেলিভারি দিন"
                    className="w-full rounded-xl bg-cream/5 border border-cream/15 px-4 py-2.5 text-cream placeholder:text-cream/30 focus:border-amber outline-none transition-colors"
                  />
                </div>

                <p className="text-cream/45 text-[12.5px] leading-relaxed">{formData.note}</p>

                <button type="submit" disabled={submitting} className="btn-amber w-full mt-2 disabled:opacity-60">
                  {submitting ? "একটু অপেক্ষা করুন..." : "হোয়াটসঅ্যাপে অর্ডার পাঠান"}
                </button>

                <div className="flex items-center justify-center gap-5 pt-1 text-cream/45 text-[12px]">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck size={13} className="text-amber" /> ক্যাশ অন ডেলিভারি
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-amber" /> ১০০% অরিজিনাল
                  </span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function WhatsAppButton({ brand }) {
  const handleClick = () => {
    trackWhatsAppClick("floating_button");
    const message = "আসসালামু আলাইকুম, Orree সম্পর্কে জানতে চাই।";
    window.open(
      `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="হোয়াটসঅ্যাপে চ্যাট করুন"
      className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber text-cream shadow-amber-glow transition-transform duration-300 hover:scale-110 active:scale-95"
    >
      <MessageCircle size={24} strokeWidth={2} />
    </button>
  );
}
