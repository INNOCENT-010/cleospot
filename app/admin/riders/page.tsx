"use client";

import { useEffect, useState } from "react";

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<any[]>([]);
  const [form, setForm] = useState({ full_name: "", phone: "" });

  async function load() {
    const res = await fetch("/api/admin/riders");
    setRiders(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/riders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ full_name: "", phone: "" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Riders</h1>
      <form onSubmit={handleSubmit} className="border rounded-xl p-4 mb-8 space-y-3 max-w-sm">
        <input required placeholder="Full name" className="w-full border rounded-lg px-3 py-2"
          value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input required placeholder="Phone number" className="w-full border rounded-lg px-3 py-2"
          value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button className="bg-brand-red text-white px-4 py-2 rounded-lg font-medium">Add rider</button>
      </form>

      <div className="space-y-2">
        {riders.map((r) => (
          <div key={r.id} className="border rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{r.full_name}</p>
              <p className="text-gray-500 text-sm">{r.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Access code</p>
              <p className="font-mono font-bold text-brand-red">{r.access_code}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-50 border rounded-xl p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-900 mb-1">How riders log in</p>
        <p>
          Send each rider their phone number and access code above via WhatsApp. They go to
          <code className="bg-white border rounded px-1 mx-1">/rider/login</code>
          on their phone, log in once, and see every order assigned to them in one dashboard —
          they don't need a separate link per order anymore.
        </p>
      </div>
    </div>
  );
}
