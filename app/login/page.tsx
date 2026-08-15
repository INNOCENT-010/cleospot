"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabaseBrowser.auth.signInWithPassword(form);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/account");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero band */}
      <div className="bg-brand-red text-white px-6 pt-12 pb-10">
        <p className="text-sm font-semibold tracking-widest uppercase opacity-80 mb-3">CLeo's Pot</p>
        <h1 className="text-3xl font-bold leading-tight mb-3">
          Welcome back. <br />Your plates await.
        </h1>
        <p className="opacity-90 text-sm leading-relaxed">
          Log in to track your orders in real time, reorder your favourites,
          and manage your saved delivery addresses.
        </p>
      </div>

      {/* Perks strip */}
      <div className="bg-[#fef2f2] px-6 py-4 flex gap-6 text-xs font-medium text-brand-red border-b border-red-100 overflow-x-auto">
        {["📦 Live order tracking", "📍 Saved addresses", "🔁 Reorder in one tap", "🎟️ Exclusive promos"].map((perk) => (
          <span key={perk} className="whitespace-nowrap">{perk}</span>
        ))}
      </div>

      {/* Form */}
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
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Link href="/login/forgot-password" className="text-xs text-brand-red hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1">
              <input
                required type={showPassword ? "text" : "password"} placeholder="Your password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-brand-red"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-brand-red text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-red text-white font-bold py-3.5 rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors text-base"
          >
            {loading ? "Logging you in…" : "Log in"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">New here?</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <Link
          href="/account/signup"
          className="mt-4 block text-center border border-gray-300 rounded-xl py-3 text-sm font-medium hover:border-brand-red hover:text-brand-red transition-colors"
        >
          Create a free account
        </Link>

        <p className="text-xs text-gray-400 text-center mt-6">No spam. No hassle. Just food. 🍲</p>
      </div>
    </div>
  );
}