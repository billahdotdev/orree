import React from "react";

/**
 * The one labelled input used across every admin tab. Handles text, number,
 * and textarea, with an optional leading icon and full-width span.
 */
export default function Field({
  label,
  value,
  onChange,
  textarea,
  disabled,
  full,
  type = "text",
  rows = 3,
  icon: Icon,
  placeholder,
  hint,
}) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="flex items-center gap-1.5 text-[13px] text-cream/60 mb-1.5">
        {Icon && <Icon size={13} />}
        {label}
      </span>
      <Comp
        type={textarea ? undefined : type}
        inputMode={type === "number" ? "numeric" : undefined}
        value={value ?? ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={textarea ? rows : undefined}
        className="w-full rounded-xl bg-cream/5 border border-cream/15 px-4 py-2.5 text-cream placeholder:text-cream/30 focus:border-amber outline-none transition-colors disabled:opacity-50"
      />
      {hint && <span className="mt-1 block text-[12px] text-cream/40 leading-relaxed">{hint}</span>}
    </label>
  );
}
