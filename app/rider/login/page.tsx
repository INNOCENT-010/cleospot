"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RiderLoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/rider/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, access_code: code })
    });
    setLoading(false);
    if (res.ok) {
      router.push("/rider");
    } else {
      const data = await res.json();
      setError(data.error || "Could not log in");
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-xl font-bold mb-2 text-center">Rider Login</h1>
      <p className="text-gray-500 text-sm text-center mb-6">
        Use the phone number and access code your admin gave you.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input required placeholder="Phone number" className="w-full border rounded-lg px-3 py-2"
          value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input required placeholder="Access code" className="w-full border rounded-lg px-3 py-2"
          value={code} onChange={(e) => setCode(e.target.value)} />
        {error && <p className="text-brand-red text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-brand-red text-white font-medium py-3 rounded-lg hover:bg-brand-dark disabled:opacity-50">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
