import React from "react";
import { BadgeCheck, Leaf, Sprout, PackageCheck } from "lucide-react";

const BADGES = [
  { id: "halal", icon: BadgeCheck, label: "হালাল সার্টিফাইড" },
  { id: "natural", icon: Leaf, label: "১০০% প্রাকৃতিক উপাদান" },
  { id: "handmade", icon: Sprout, label: "ছোট ব্যাচে হাতে বানানো" },
  { id: "packaging", icon: PackageCheck, label: "নিরাপদ, সিলড প্যাকেজিং" },
];

export default function TrustBadges() {
  return (
    <div className="bg-green-deeper/60 border-y border-cream/10 py-6">
      <div className="container-orree">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BADGES.map(({ id, icon: Icon, label }) => (
            <div key={id} className="flex items-center gap-2.5 justify-center sm:justify-start">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/15 text-amber shrink-0">
                <Icon size={15} strokeWidth={2} />
              </span>
              <span className="text-cream/70 text-[13px] sm:text-[13.5px] leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
