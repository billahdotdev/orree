import React, { useState } from "react";
import { Plus } from "lucide-react";
import useScrollReveal from "../hooks/useScrollReveal.js";
import { trackFaqOpen } from "../tracker.js";

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4.5 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-display font-medium text-cream text-[15px] sm:text-[15.5px]">{item.q}</span>
        <Plus size={18} className={`text-amber shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="px-5 sm:px-6 pb-5 text-cream/65 text-[14px] leading-relaxed">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_FAQS = [
  {
    q: "ডেলিভারি পেতে কত সময় লাগে?",
    a: "খুলনার ভেতরে সাধারণত ১-২ দিন, আর সারা বাংলাদেশে ২-৪ কার্যদিবসের মধ্যে অর্ডার পৌঁছে যায়। কুরিয়ার ট্র্যাকিং নম্বর অর্ডার কনফার্মেশনের সাথেই দেওয়া হয়।",
  },
  {
    q: "পেমেন্ট কীভাবে করব?",
    a: "আমরা ক্যাশ অন ডেলিভারি (COD) সাপোর্ট করি — প্রোডাক্ট হাতে পেয়ে টাকা দিতে পারবেন। অগ্রিম পেমেন্টের প্রয়োজন নেই।",
  },
  {
    q: "প্রোডাক্টে কি কোনো কৃত্রিম উপাদান আছে?",
    a: "না। আমাদের প্রতিটা প্রোডাক্ট প্রাকৃতিক উপাদান দিয়ে তৈরি, কোনো কৃত্রিম রঙ বা প্রিজারভেটিভ ব্যবহার করা হয় না।",
  },
  {
    q: "একসাথে কয়েকটা প্রোডাক্ট অর্ডার করা যাবে?",
    a: "অবশ্যই। কার্টে একাধিক প্রোডাক্ট যোগ করে একবারেই অর্ডার করতে পারবেন — ডেলিভারি চার্জ একবারই প্রযোজ্য হবে।",
  },
];

export default function FAQ({ faqs = DEFAULT_FAQS }) {
  const [openIndex, setOpenIndex] = useState(0);
  const { ref, isVisible } = useScrollReveal();

  const toggle = (i) => {
    const next = openIndex === i ? -1 : i;
    setOpenIndex(next);
    if (next !== -1) trackFaqOpen(faqs[i].q);
  };

  return (
    <section id="faq" className="relative bg-green-deeper py-24 sm:py-32 scroll-mt-20">
      <div className="container-orree">
        <div
          ref={ref}
          className={`max-w-xl mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="eyebrow mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
            যা জানা দরকার
          </p>
          <h2 className="text-balance font-display font-bold text-3xl sm:text-4xl text-cream mb-4">
            প্রায়ই জিজ্ঞাসিত প্রশ্ন
          </h2>
        </div>

        <div className="max-w-2xl space-y-3">
          {faqs.map((item, i) => (
            <FaqItem key={item.q} item={item} isOpen={openIndex === i} onToggle={() => toggle(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
