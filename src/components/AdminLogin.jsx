import React, { useState } from "react";
import { Lock, ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { verifyPassword } from "../services/contentService.js";

export default function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || checking) return;

    setChecking(true);
    setError("");
    const result = await verifyPassword(password);
    setChecking(false);

    if (result.ok) {
      onSuccess(password); // kept in memory for this session only
    } else {
      setError(result.message || "ভুল পাসওয়ার্ড");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-green-deep text-cream flex items-center justify-center px-6 font-body">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2 text-cream/50 hover:text-amber text-sm mb-8">
          <ArrowLeft size={16} /> সাইটে ফিরুন
        </Link>

        <div className="glass rounded-3xl p-7 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/15 text-amber mb-5">
            <Lock size={20} />
          </div>

          <h1 className="font-display font-bold text-xl mb-2">অ্যাডমিন প্যানেল</h1>
          <p className="text-cream/60 text-[14px] leading-relaxed mb-6">
            প্রোডাক্ট, দাম ও স্টক পরিবর্তন করতে পাসওয়ার্ড দিন।
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড"
                autoFocus
                className="w-full rounded-xl bg-cream/5 border border-cream/15 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-amber outline-none transition-colors"
              />
              {error && <p className="text-amber text-[12.5px] mt-2">{error}</p>}
            </div>

            <button type="submit" disabled={checking || !password} className="btn-amber w-full disabled:opacity-50">
              {checking ? "যাচাই করা হচ্ছে..." : "প্রবেশ করুন"}
            </button>
          </form>
        </div>

        <div className="flex gap-2.5 mt-6 text-cream/40 text-[12px] leading-relaxed">
          <ShieldAlert size={14} className="shrink-0 mt-0.5" />
          <p>
            পাসওয়ার্ডটি সার্ভারে (Google Apps Script) যাচাই হয় — ওয়েবসাইটের কোডে কোথাও রাখা নেই। তাই কেউ কোড
            দেখে পাসওয়ার্ড বের করতে পারবে না।
          </p>
        </div>
      </div>
    </div>
  );
}
