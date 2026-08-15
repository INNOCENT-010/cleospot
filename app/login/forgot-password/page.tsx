"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/reset-password`
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-brand-red text-white px-6 pt-12 pb-10">
        <p className="text-sm font-semibold tracking-widest uppercase opacity-80 mb-3">CLeo's Pot</p>
        <h1 className="text-3xl font-bold leading-tight mb-3">Reset your password</h1>
        <p className="opacity-90 text-sm leading-relaxed">
          Enter your email and we'll send you a link to set a new password.
        </p>
      </div>
      <div className="flex-1 px-6 py-8 max-w-sm mx-auto w-full">
        {sent ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-4">📬</p>
            <p className="font-semibold text-lg mb-2">Check your email</p>
            <p className="text-gray-500 text-sm mb-6">We sent a reset link to <strong>{email}</strong>. Check your inbox and spam folder.</p>
            <Link href="/login" className="text-brand-red font-medium text-sm">Back to login →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                required type="email" placeholder="you@example.com"
                className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-red"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-brand-red text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-brand-red text-white font-bold py-3.5 rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors">
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <Link href="/login" className="block text-center text-sm text-gray-500 hover:text-brand-red mt-2">
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}