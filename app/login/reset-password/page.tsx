"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase puts the token in the URL hash — just need to be on the page
    supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabaseBrowser.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/account");
  }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Verifying your reset link…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-brand-red text-white px-6 pt-12 pb-10">
        <p className="text-sm font-semibold tracking-widest uppercase opacity-80 mb-3">CLeo's Pot</p>
        <h1 className="text-3xl font-bold leading-tight mb-3">Set new password</h1>
        <p className="opacity-90 text-sm">Choose a strong password for your account.</p>
      </div>
      <div className="flex-1 px-6 py-8 max-w-sm mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">New password</label>
            <div className="relative mt-1">
              <input
                required
                type={show ? "text" : "password"}
                placeholder="At least 6 characters"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-brand-red"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? (
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
          {error && <p className="text-brand-red text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-brand-red text-white font-bold py-3.5 rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors">
            {loading ? "Updating…" : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  );
}