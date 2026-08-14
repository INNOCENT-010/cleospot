"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/account/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabaseBrowser.auth.signInWithPassword(form);
    setLoading(false);
    if (signInError) { setError(signInError.message); return; }
    router.push("/account");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-brand-red text-white px-6 pt-12 pb-10">
        <p className="text-sm font-semibold tracking-widest uppercase opacity-80 mb-3">CLeo's Pot</p>
        <h1 className="text-3xl font-bold leading-tight mb-3">
          Create an account<br />in under&nbsp;1&nbsp;minute.
        </h1>
        <p className="opacity-90 text-sm leading-relaxed">
          Track every order in real time, save your favourite delivery addresses,
          and reorder your go-to meals in seconds — no phone calls, no hassle.
        </p>
      </div>

      <div className="bg-[#fef2f2] px-6 py-4 flex gap-6 text-xs font-medium text-brand-red border-b border-red-100 overflow-x-auto">
        {["📦 Live order tracking", "📍 Saved addresses", "🔁 Reorder in one tap", "🎟️ Exclusive promos"].map((perk) => (
          <span key={perk} className="whitespace-nowrap">{perk}</span>
        ))}
      </div>

      <div className="flex-1 px-6 py-8 max-w-sm mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              required type="email" placeholder="you@example.com"
              className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-red"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              required type="password" placeholder="At least 6 characters"
              className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-red"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && (
            <p className="text-brand-red text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-red text-white font-bold py-3.5 rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors text-base"
          >
            {loading ? "Creating your account…" : "Create account — it's free"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">Already have one?</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <Link
          href="/account/signup"
          className="mt-4 block text-center border border-gray-300 rounded-xl py-3 text-sm font-medium hover:border-brand-red hover:text-brand-red transition-colors"
        >
          Log in instead
        </Link>
        <p className="text-xs text-gray-400 text-center mt-6">No spam. No verification email. Just food. 🍲</p>
      </div>
    </div>
  );
}