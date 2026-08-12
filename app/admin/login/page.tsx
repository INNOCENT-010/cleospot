"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Incorrect password");
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-xl font-bold mb-6 text-center brand-script text-brand-red">CLeo's Pot Admin</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Admin password"
          className="w-full border rounded-lg px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-brand-red text-sm">{error}</p>}
        <button className="w-full bg-brand-red text-white font-medium py-3 rounded-lg hover:bg-brand-dark">
          Log in
        </button>
      </form>
    </div>
  );
}
