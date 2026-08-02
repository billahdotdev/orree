import React, { useEffect } from "react";
import { X } from "lucide-react";
import useFocusTrap from "../hooks/useFocusTrap.js";

function Modal({ title, onClose, children }) {
  const dialogRef = useFocusTrap(true);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center" role="presentation">
      <button type="button" aria-label="বন্ধ করুন" onClick={onClose} className="absolute inset-0 bg-green-deeper/85 backdrop-blur-sm" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full sm:max-w-xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-green-deep border border-cream/15 shadow-glass animate-fade-up outline-none"
      >
        <div className="sticky top-0 flex items-center justify-between px-6 sm:px-7 pt-6 pb-4 bg-green-deep/95 backdrop-blur border-b border-cream/10">
          <h3 className="font-display font-bold text-lg sm:text-xl text-cream">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex h-9 w-9 items-center justify-center rounded-full glass hover:border-amber/40 shrink-0"
          >
            <X size={16} className="text-cream" />
          </button>
        </div>
        <div className="px-6 sm:px-7 py-6 space-y-5 text-cream/75 text-[14.5px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Section({ heading, children }) {
  return (
    <div>
      <h4 className="font-display font-semibold text-cream text-[15.5px] mb-2">{heading}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function PrivacyPolicyModal({ onClose, brand }) {
  return (
    <Modal title="প্রাইভেসি পলিসি" onClose={onClose}>
      <p>
        Orree-তে আপনার বিশ্বাসকে আমরা সবচেয়ে বেশি গুরুত্ব দিই। এই পেজে বলা আছে আমরা আপনার তথ্য কীভাবে সংগ্রহ ও ব্যবহার করি —
        সহজ ভাষায়, কোনো জটিলতা ছাড়াই।
      </p>

      <Section heading="আমরা যা সংগ্রহ করি">
        অর্ডার করার সময় আপনার নাম, ফোন নম্বর ও ডেলিভারি ঠিকানা নেওয়া হয় — শুধুমাত্র আপনার প্রোডাক্ট সঠিক জায়গায় পৌঁছে দেওয়ার জন্য।
        এছাড়া, ওয়েবসাইট ব্যবহারের অভিজ্ঞতা ভালো করতে আমরা সাধারণ অ্যানালিটিক্স ডেটা (যেমন কোন পেজ দেখা হয়েছে) সংগ্রহ করি।
      </Section>

      <Section heading="আমরা যা করি না">
        আপনার তথ্য আমরা কখনও তৃতীয় পক্ষের কাছে বিক্রি করি না। শুধুমাত্র অর্ডার প্রসেস করতে প্রয়োজনীয় ক্ষেত্রেই (যেমন ডেলিভারি
        পার্টনার) তথ্য শেয়ার করা হয়।
      </Section>

      <Section heading="কুকিজ ও ট্র্যাকিং">
        আমাদের সাইট Google Analytics ও Meta Pixel ব্যবহার করে বুঝতে যে কোন কন্টেন্ট আপনাদের কাজে লাগছে, এবং প্রাসঙ্গিক বিজ্ঞাপন
        দেখাতে। আপনি চাইলে ব্রাউজার সেটিংস থেকে যেকোনো সময় কুকিজ বন্ধ করে দিতে পারেন।
      </Section>

      <Section heading="যোগাযোগ">
        আপনার তথ্য নিয়ে কোনো প্রশ্ন থাকলে সরাসরি{" "}
        <a href={`mailto:${brand.email}`} className="text-amber hover:underline">
          {brand.email}
        </a>{" "}
        এ মেইল করুন, আমরা দ্রুত জবাব দেব।
      </Section>
    </Modal>
  );
}

export function ReturnRefundModal({ onClose, brand }) {
  return (
    <Modal title="রিটার্ন ও রিফান্ড পলিসি" onClose={onClose}>
      <p>
        আমরা চাই প্রতিটা অর্ডারে আপনি সন্তুষ্ট থাকুন। কোনো কারণে প্রোডাক্ট নিয়ে সমস্যা হলে, নিচের নিয়ম অনুযায়ী আমরা পাশে আছি।
      </p>

      <Section heading="রিটার্নের শর্ত">
        প্রোডাক্ট হাতে পাওয়ার ২৪ ঘণ্টার মধ্যে প্যাকেজিং অক্ষত অবস্থায় থাকলে এবং প্রোডাক্টে উৎপাদনগত ত্রুটি বা ড্যামেজ থাকলে রিটার্ন
        গ্রহণযোগ্য। খাদ্যপণ্য হওয়ায় শুধুমাত্র সিলবিহীন/ড্যামেজড প্যাকেট বা ভুল প্রোডাক্ট পাঠানো হলে রিটার্ন নেওয়া হয়।
      </Section>

      <Section heading="রিফান্ড প্রসেস">
        রিটার্ন অনুমোদিত হলে আপনার পছন্দমতো — রিপ্লেসমেন্ট অথবা বিকাশ/নগদে রিফান্ড — ব্যবস্থা করা হয়, সাধারণত ৩-৫ কার্যদিবসের
        মধ্যে।
      </Section>

      <Section heading="কীভাবে অনুরোধ করবেন">
        ডেলিভারির পর সমস্যা মনে হলে সঙ্গে সঙ্গে{" "}
        <a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-amber hover:underline">
          হোয়াটসঅ্যাপে
        </a>{" "}
        অর্ডার নম্বরসহ প্রোডাক্টের ছবি পাঠান — আমরা ২৪ ঘণ্টার মধ্যে যোগাযোগ করব।
      </Section>

      <Section heading="ব্যতিক্রম">
        খাদ্যপণ্য হওয়ায় স্বাদ ব্যক্তিগত পছন্দের কারণে (প্রোডাক্টে কোনো ত্রুটি না থাকলে) রিটার্ন প্রযোজ্য নয়। প্রতিটা ব্যাচ আমরা যত্ন
        নিয়ে বানাই, আর প্রতিটা অভিযোগ গুরুত্ব সহকারে দেখি।
      </Section>
    </Modal>
  );
}
